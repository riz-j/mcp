// \\wsl.localhost\Debian\home\rizki\Code\mcp\apps\mssql\server.ts

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import sql from "mssql";
import { ToolResponse } from "./utils";

const sqlConfig = {
	user: "sa",
	password: "YourStrong(!)Password",
	database: "master",
	server: "localhost",
	port: 1433,
	pool: {
		max: 10,
		min: 0,
		idleTimeoutMillis: 30000,
	},
	options: {
		encrypt: false,
		trustServerCertificate: true,
	},
}

await sql.connect(sqlConfig).catch(err => {
	console.error("Error connecting to MSSQL:", err);
	process.exit(1);
});

const server = new McpServer({
	name: "mssql-mcp",
	version: "1.0.0",
});

server.tool("get-user-local-time", async () => ToolResponse(new Date().toLocaleString()));
server.tool("get-user-location", async () => ToolResponse("Melbourne, Australia"));

server.tool("execute-query", { query: z.string() }, async ({ query }) => {
	const result = await sql.query(query);
	return ToolResponse(result);
});

server.tool("get-database-tables-and-schemas", {}, async () => {
	const result = await sql.query(`
		SELECT t.name AS TableName
			,(
				SELECT c.name AS columnName
					,ty.name AS dataType
				FROM sys.columns c
				INNER JOIN sys.types ty ON c.user_type_id = ty.user_type_id
				WHERE c.object_id = t.object_id
				FOR JSON PATH
				) AS ColumnsJson
		FROM sys.tables t
		WHERE t.name NOT LIKE '%spt_%'
			AND t.name NOT LIKE '%MSreplication_options%';  
	`);

	return ToolResponse(result.recordset);
});

const transport = new StdioServerTransport();
await server.connect(transport);