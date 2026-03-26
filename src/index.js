import express from 'express';
import 'dotenv/config';
import { searchProperty, closeBrowser } from './tractiq.js';
import { formatPropertyData, formatMarkdownReport } from './formatter.js';

const app = express();
const PORT = process.env.PORT || 8080;

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

app.use(express.json());

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Tract IQ MCP Server (live scraper) is running',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
  });
});

app.post('/search', async (req, res) => {
  const { address, format = 'json', reportType = 'full' } = req.body;
  if (!address || typeof address !== 'string' || address.trim().length < 5) {
    return res.status(400).json({ error: 'Invalid request', message: 'address is required' });
  }
  if (!process.env.TRACT_IQ_EMAIL || !process.env.TRACT_IQ_PASSWORD) {
    return res.status(500).json({ error: 'Configuration error', message: 'TRACT_IQ_EMAIL and TRACT_IQ_PASSWORD must be set' });
  }
  console.log(`[${new Date().toISOString()}] Search request: ${address}`);
  try {
    const rawData = await searchProperty(address.trim());
    const structured = formatPropertyData(rawData);
    if (format === 'markdown') {
      const report = formatMarkdownReport(structured);
      return res.json({ address, report, timestamp: structured.timestamp });
    }
    return res.json(structured);
  } catch (error) {
    console.error('Search error:', error.message);
    return res.status(500).json({ error: 'Scraping failed', message: error.message });
  }
});

app.post('/summary', async (req, res) => {
  const { address } = req.body;
  if (!address) return res.status(400).json({ error: 'address is required' });
  try {
    const rawData = await searchProperty(address.trim());
    const structured = formatPropertyData(rawData);
    const report = formatMarkdownReport(structured);
    return res.json({ address, report, data: structured.supply });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.post('/demographics', async (req, res) => {
  const { address } = req.body;
  if (!address) return res.status(400).json({ error: 'address is required' });
  try {
    const rawData = await searchProperty(address.trim());
    const structured = formatPropertyData(rawData);
    return res.json({ address, data: structured.demographics });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.post('/comps', async (req, res) => {
  const { address } = req.body;
  if (!address) return res.status(400).json({ error: 'address is required' });
  try {
    const rawData = await searchProperty(address.trim());
    const structured = formatPropertyData(rawData);
    return res.json({ address, tables: structured.tables, rawStats: structured.rawStats });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

process.on('SIGTERM', async () => { await closeBrowser(); process.exit(0); });
process.on('SIGINT', async () => { await closeBrowser(); process.exit(0); });

app.listen(PORT, () => {
  console.log(`✅ Tract IQ MCP Server running on port ${PORT}`);
  console.log(`   Health:       GET  /health`);
  console.log(`   Search:       POST /search`);
  console.log(`   Summary:      POST /summary`);
  console.log(`   Demographics: POST /demographics`);
  console.log(`   Comps:        POST /comps`);
});
