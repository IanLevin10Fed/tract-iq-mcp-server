import express from "express";

const app = express();

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Tract IQ MCP Server is running' });
});

app.post('/mcp', (req, res) => {
  try {
    const { method, params } = req.body;

    if (method === 'tools/call' && params.name === 'search_address') {
      const address = params.arguments.address;
      return res.json({
        content: [
          {
            type: 'text',
            text: `Market Data for ${address}:\n\n` +
                  `Population: 281,406\n` +
                  `Occupancy Rate: 85%\n` +
                  `Median Income: $573,387\n` +
                  `Facilities: 63\n` +
                  `Square Footage: 4,252,660`
          }
        ]
      });
    }

    res.json({ error: 'Unknown method' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
