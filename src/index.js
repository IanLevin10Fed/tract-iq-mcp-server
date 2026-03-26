import express from "express";

const app = express();

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  next();
});

app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Tract IQ MCP Server is running' });
});

app.post('/mcp', (req, res) => {
  const { method, params } = req.body;

  if (method === 'tools/call' && params?.name === 'search_address') {
    const address = params.arguments?.address || 'Unknown';
    res.json({
      content: [
        {
          type: 'text',
          text: `Market Data for ${address}:\n\nPopulation: 281,406\nOccupancy Rate: 85%\nMedian Income: $573,387\nFacilities: 63\nSquare Footage: 4,252,660`
        }
      ]
    });
  } else {
    res.json({ error: 'Invalid request' });
  }
});

app.listen(8080, () => {
  console.log('Server running on port 8080');
});
