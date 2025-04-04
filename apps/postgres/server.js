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

const server = new McpServer({
  name: "my-postgres",
  version: "1.0.0",
});

server.tool("list tasks",
  {  },
  async function() {
    const result = await client.query("SELECT * FROM tasks");
    const tasks = result.rows;

    return {
      contents: [
        {
          uri: "/tasks",
          mimeType: "application/json",
          text: JSON.stringify(tasks),
        }
      ]
    }
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);