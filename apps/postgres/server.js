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
}, {
	capabilities: {
		resources: {}
	}
});

server.tool("listUsers", 
	{},
	async () => ToolResponse(["Joe, Jane, James"])
);

// Add a dynamic greeting resource
server.resource(
	"greeting",
	new ResourceTemplate("greeting://{name}", { list: undefined }),
	async (uri, { name }) => ({
	  contents: [{
		uri: uri.href,
		text: `Hello, ${name}!`
	  }]
	})
  );

server.tool("listTasks",
	{},
	async () => {
		const client = await pool.connect();

		const result = await client.query("SELECT * FROM tasks");
		const tasks = result.rows;

		client.release();
		
		return ToolResponse(tasks);
	}
);

server.tool("executeQuery",
	{ query: z.string() },
	async ({ query }) => {

		const client = await pool.connect();
		const result = await client.query(query);
		client.release();

		return ToolResponse(result);
	}
)

server.tool("getDatabaseTables", {}, async () => {
	const client = await pool.connect();
	const result = await client.query(`
		SELECT
			table_name
		FROM
			information_schema.tables
		WHERE
			table_schema NOT IN ('information_schema', 'pg_catalog')
		ORDER BY
			table_name;
	`);
	client.release();

	return ToolResponse(result.rows);
});

server.tool("getDatabaseSchemas", {},
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

// server.resource("schema", 
// 	"schema://postgres",
// 	async (uri) => {
// 		const client = await pool.connect();
// 		const result = await client.query(`
// 			SELECT
// 				table_name,
// 				JSON_AGG(
// 					JSON_BUILD_OBJECT(
// 						'column_name', column_name,
// 						'data_type', data_type
// 					)
// 				) AS columns
// 			FROM
// 				information_schema.columns
// 			WHERE
// 				table_schema NOT IN ('information_schema', 'pg_catalog')
// 			GROUP BY
// 				table_schema, table_name
// 			ORDER BY
// 				table_schema, table_name;
// 		`);
// 		client.release();

// 		return {
// 			contents: [{
// 				uri: uri.href,
// 				text: JSON.stringify(result.rows),
// 			}]
// 		}
// 	}
// );

const transport = new StdioServerTransport();
await server.connect(transport);