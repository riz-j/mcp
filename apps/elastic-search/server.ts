import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { executeSearch, TextResponse } from "./utils";
import { z } from "zod";

const server = new McpServer({
	name: "elastic-search-client",
	version: "1.0.0",
});

server.tool("execute-search", { searchTerm: z.string() }, async ({ searchTerm }) => {
	const result = await executeSearch<any>(searchTerm);

	return TextResponse(result);
});

const transport = new StdioServerTransport();
await server.connect(transport);