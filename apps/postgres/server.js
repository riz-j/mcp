// \\wsl.localhost\Debian\home\rizki\Code\mcp\apps\postgres\server.js

import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import pg from "pg";

function ToolResponse(data) {
	return {
		content: [{ type: "text", text: JSON.stringify(data) }]
	}
}

const pool = new pg.Pool({
	connectionString: "postgresql://admin:admin@localhost/postgres",
});

const server = new McpServer({
	name: "my-postgres",
	version: "1.0.0",
});

server.prompt("query-database", { query: z.string() }, async ({ query }) => {
	return {
		messages: [{
			role: "user",
			content: {
				type: "text",
				text:  `Prior to executing any database queries, please call the get-database-tables-and-schemas tool \n\n ${query}`
			}
		}]
	}
});

server.tool("execute-query",
	{ query: z.string() },
	async ({ query }) => {

		const client = await pool.connect();
		const result = await client.query(query);
		client.release();

		return ToolResponse(result);
	}
)

server.tool("get-database-tables-and-schemas", {},
	async () => {
		const client = await pool.connect();
		const result = await client.query(`
			SELECT
				table_name,
				JSON_AGG(
					JSON_BUILD_OBJECT(
						'column_name', column_name,
						'data_type', data_type
					)
				) AS columns
			FROM
				information_schema.columns
			WHERE
				table_schema NOT IN ('information_schema', 'pg_catalog')
			GROUP BY
				table_schema, table_name
			ORDER BY
				table_schema, table_name;
		`);
		client.release();

		return ToolResponse(result.rows);
	}
)

server.resource(
	"convictedFelons",
	"data://convictedFelons",
	async (uri) => ({
	  contents: [{
		uri: uri.href,
		text: JSON.stringify(["Jeffrey Dahmer", "Jack Reaper"])
	  }]
	})
  );

const transport = new StdioServerTransport();
await server.connect(transport);