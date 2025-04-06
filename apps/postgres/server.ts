// \\wsl.localhost\Debian\home\rizki\Code\mcp\apps\postgres\server.js

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import pg from "pg";
import { ToolResponse } from "./utils";

const pool = new pg.Pool({
	connectionString: "postgresql://admin:admin@localhost/postgres",
});

const client = await pool.connect();

const server = new McpServer({
	name: "my-postgres",
	version: "1.0.0",
});

server.tool("get-user-local-time", async () => ToolResponse(new Date().toLocaleString()));
server.tool("get-user-location", async () => ToolResponse("Melbourne, Australia"));

server.tool("execute-query", { query: z.string() }, async ({ query }) => {
	const result = await client.query(query);

	return ToolResponse(result);
});

server.tool("get-database-tables-and-schemas", {}, async () => {
	const result = await client.query(`
		SELECT table_name
			,JSON_AGG(
				JSON_BUILD_OBJECT(
					'column_name', column_name,
					'data_type', data_type
				)
			) AS columns
		FROM information_schema.columns
		WHERE table_schema NOT IN ('information_schema', 'pg_catalog')
		GROUP BY table_schema, table_name
		ORDER BY table_schema, table_name;
	`);

	return ToolResponse(result.rows);
});

const transport = new StdioServerTransport();
await server.connect(transport);