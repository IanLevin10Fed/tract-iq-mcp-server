import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import express from "express";

const server = new McpServer({
  name: "tract-iq-mcp-server",
  version: "1.0.0"
});

server.registerTool("search_address", {
  title: "Search Address",
  description: "Search for market data at an address",
  inputSchema: {
    type: "object",
    properties: {
      address: {
        type: "string",
        description: "Property address"
      }
    },
    required: ["address"]
  }
}, async (params) => {
  const result = {
    address: params.address,
    population: 281406,
    occupancyRate: 0.85,
    medianIncome: 573387,
    facilities: 63,
    squareFootage: 4252660
  };
  
  return {
    content: [{
      type: "text",
      text: `Market Data for ${params.address}:\n\n${JSON.stringify(result, null, 2)}`
    }]
  };
});

const app = express();
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Tract IQ MCP Server is running' });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log(`Health check: http://localhost:${port}/health`);
});
