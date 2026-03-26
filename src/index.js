import express from "express";

const app = express();
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Tract IQ MCP Server is running' });
});

app.post('/mcp', (req, res) => {
  res.json({ message: 'MCP endpoint ready' });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
