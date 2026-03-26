import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import express from "express";

const server = new McpServer({
  name: "tract-iq-mcp-server",
  version: "1.0.0"
});

function generateMockData(address) {
  return {
    address,
    status: 'active',
    message: `Market analysis data for ${address}`,
    population: 281406,
    occupancyRate: 0.85,
    medianIncome: 573387
  };
}

server.registerTool("tract_iq_search_property", {
  title: "Search Property",
  description: "Search for property market data",
  inputSchema: { type: "object", properties: { address: { type: "string" } }, required: ["address"] }
}, async (params) => {
  const data = generateMockData(params.address);
  return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
});

async function runHTTP() {
  const app = express();
  app.use(express.json());

  app.post('/mcp', async (req, res) => {
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
      enableJsonResponse: true
    });

    res.on('close', () => {
      transport.close().catch((err) => {
        console.error("Transport close error:", err);
      });
    });

    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  });

  app.get('/health', (req, res) => {
    res.json({ status: 'ok', message: 'Tract IQ MCP Server is running' });
  });

  const port = parseInt(process.env.PORT || '3000');
  app.listen(port, () => {
    console.error(`MCP server running on http://localhost:${port}/mcp`);
  });
}

runHTTP().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
