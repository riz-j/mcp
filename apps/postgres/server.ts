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

server.tool("perform_select_query", { query: z.string() }, async ({ query }) => {
	await client.query("BEGIN TRANSACTION READ ONLY");
	const result = await client.query(query);
	await client.query("COMMIT");

	return ToolResponse(result.rows);
});

server.tool("perform_insert_query", { query: z.string() }, async ({ query }) => {
	const result = await client.query(query);
	return ToolResponse({ insertedRows: result.rowCount });
});

server.tool("perform_update_query", { query: z.string() }, async ({ query }) => {
	const result = await client.query(query);
	return ToolResponse({ rowsAffected: result.rowCount });
});

server.tool("perform_delete_query", { query: z.string() }, async ({ query }) => {
	const result = await client.query(query);
	return ToolResponse({ deletedRows: result.rowCount });
});

server.tool("perform_alter_create_or_drop_query", { query: z.string() }, async ({ query }) => {
	const result = await client.query(query);
	return ToolResponse({ message: "Success! The query has been executed successfully! Please re-query the database schema to ensure the changes have been applied." });
});

server.tool("get_database_tables_and_columns", async () => {
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
