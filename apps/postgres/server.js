import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import pg from "pg";

const pool = new pg.Pool({
	connectionString: "postgresql://admin:admin@localhost/postgres",
});

const server = new McpServer({
	name: "my-postgres",
	version: "1.0.0",
});

server.tool("listUsers", 
	{},
	async () => ({
		content: [{ type: "text", text: JSON.stringify(["Joe, Jane, James"]) }]
	})
);

server.tool("listTasks",
	{},
	async () => {
		const client = await pool.connect();

		const result = await client.query("SELECT * FROM tasks");
		const tasks = result.rows;

		client.release();
		
		return {
			content: [{ type: "text", text: JSON.stringify(tasks) }]
		}
	}
);

const transport = new StdioServerTransport();
await server.connect(transport);