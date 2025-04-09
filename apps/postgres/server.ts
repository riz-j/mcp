// \\wsl.localhost\Debian\home\rizki\Code\mcp\apps\postgres\server.js

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import pg from "pg";
import { ToolResponse } from "./utils";

const pool = new pg.Pool({
	connectionString: "postgresql://postgres:postgres@localhost/postgres",
});

const client = await pool.connect();

const server = new McpServer({
	name: "my-postgres",
	version: "1.0.0",
});

server.tool("execute-query", { query: z.string() }, async ({ query }) => {
	// await client.query("BEGIN TRANSACTION READ ONLY");
	const result = await client.query(query);
	// await client.query("COMMIT");

	return ToolResponse(result);
});

server.tool("get-database-tables-and-columns", { any: z.boolean() }, async () => {
	const result = await client.query(`
		SELECT table_name, column_name, data_type, is_nullable
		FROM information_schema.columns
		WHERE table_schema NOT IN ('information_schema', 'pg_catalog')
		ORDER BY table_name;
	`);

	return ToolResponse(result.rows);
});

const transport = new StdioServerTransport();
await server.connect(transport);
