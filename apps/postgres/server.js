import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import pg from "pg";

const pool = new pg.Pool({
  connectionString: "postgresql://admin:admin@localhost/postgres",
});

const client = await pool.connect();
const result = await client.query("SELECT * FROM tasks");

console.log(result);

process.abort();

const server = new McpServer({
  name: "calculator",
  version: "1.0.0",
});

server.tool("add",
  { a: z.number(), b: z.number() },
  async ({ a, b }) => ({
    content: [{ type: "text", text: `The calculation result is: ${String(a + b)}` }]
  })
);

const transport = new StdioServerTransport();
await server.connect(transport);