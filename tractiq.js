/**
 * Tract IQ MCP Server
 * Express HTTP server exposing Playwright-based Tract IQ scraping
 * as a REST API for use with Claude.
 */

import express from 'express';
import 'dotenv/config';
import { searchProperty, closeBrowser } from './tractiq.js';
import { formatPropertyData, formatMarkdownReport } from './formatter.js';

const app = express();
const PORT = process.env.PORT || 8080;

// ─── CORS ────────────────────────────────────────────────────────────────────
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

app.use(express.json());

// ─── HEALTH ───────────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Tract IQ MCP Server (live scraper) is running',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
  });
});

// ─── MAIN SEARCH ENDPOINT ─────────────────────────────────────────────────────
/**
 * POST /search
 * Body: { address: string, format?: "json" | "markdown", reportType?: string }
 * Returns: structured market data from Tract IQ
 */
app.post('/search', async (req, res) => {
  const { address, format = 'json', reportType = 'full' } = req.body;

  if (!address || typeof address !== 'string' || address.trim().length < 5) {
    return res.status(400).json({
      error: 'Invalid request',
      message: 'address is required and must be a non-empty string',
    });
  }

  if (!process.env.TRACT_IQ_EMAIL || !process.env.TRACT_IQ_PASSWORD) {
    return res.status(500).json({
      error: 'Configuration error',
      message: 'TRACT_IQ_EMAIL and TRACT_IQ_PASSWORD environment variables must be set',
    });
  }

  console.log(`[${new Date().toISOString()}] Search request: ${address}`);

  try {
    const rawData = await searchProperty(address.trim());
    const structured = formatPropertyData(rawData);

    if (format === 'markdown') {
      const report = formatMarkdownReport(structured, reportType);
      return res.json({ address, report, timestamp: structured.timestamp });
    }

    return res.json(structured);
  } catch (error) {
    console.error('Search error:', error.message);

    // Return useful error info
    const isLoginError = error.message.toLowerCase().includes('login') ||
                         error.message.toLowerCase().includes('auth') ||
                         error.message.toLowerCase().includes('password');

    return res.status(500).json({
      error: 'Scraping failed',
      message: error.message,
      hint: isLoginError
        ? 'Check TRACT_IQ_EMAIL and TRACT_IQ_PASSWORD environment variables'
        : 'Tract IQ UI may have changed — check selector patterns in tractiq.js',
    });
  }
});

// ─── EXECUTIVE SUMMARY SHORTCUT ───────────────────────────────────────────────
/**
 * POST /summary
 * Alias for /search that always returns markdown executive summary format
 */
app.post('/summary', async (req, res) => {
  req.body.format = 'markdown';
  req.body.reportType = 'supply_only';

  const { address } = req.body;
  if (!address) {
    return res.status(400).json({ error: 'address is required' });
  }

  try {
    const rawData = await searchProperty(address.trim());
    const structured = formatPropertyData(rawData);
    const report = formatMarkdownReport(structured, 'supply_only');
    return res.json({ address, report, data: structured.supply });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// ─── DEMOGRAPHICS SHORTCUT ────────────────────────────────────────────────────
app.post('/demographics', async (req, res) => {
  const { address } = req.body;
  if (!address) {
    return res.status(400).json({ error: 'address is required' });
  }

  try {
    const rawData = await searchProperty(address.trim());
    const structured = formatPropertyData(rawData);
    const report = formatMarkdownReport(structured, 'demographics_only');
    return res.json({ address, report, data: structured.demographics });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// ─── COMPS SHORTCUT ───────────────────────────────────────────────────────────
app.post('/comps', async (req, res) => {
  const { address } = req.body;
  if (!address) {
    return res.status(400).json({ error: 'address is required' });
  }

  try {
    const rawData = await searchProperty(address.trim());
    const structured = formatPropertyData(rawData);
    return res.json({
      address,
      rentalComps: structured.rentalComps,
      rateTrends: structured.rateTrends,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// ─── GRACEFUL SHUTDOWN ────────────────────────────────────────────────────────
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing browser...');
  await closeBrowser();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, closing browser...');
  await closeBrowser();
  process.exit(0);
});

// ─── START ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✅ Tract IQ MCP Server running on port ${PORT}`);
  console.log(`   Health:      GET  /health`);
  console.log(`   Search:      POST /search      { address, format?, reportType? }`);
  console.log(`   Summary:     POST /summary     { address }`);
  console.log(`   Demographics:POST /demographics { address }`);
  console.log(`   Comps:       POST /comps       { address }`);
});
