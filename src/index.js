import express from "express";

const app = express();
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Tract IQ MCP Server is running' });
});

app.post('/mcp', (req, res) => {
  try {
    const { method, params } = req.body;

    if (method === 'tools/list') {
      return res.json({
        tools: [
          {
            name: 'search_address',
            description: 'Search for market data at an address',
            inputSchema: {
              type: 'object',
              properties: {
                address: {
                  type: 'string',
                  description: 'Property address'
                }
              },
              required: ['address']
            }
          }
        ]
      });
    }

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
                  `Square Footage: 4,252,660\n\n` +
                  `This is sample data. Real Tract IQ integration coming soon.`
          }
        ]
      });
    }

    res.json({ error: 'Unknown method' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
