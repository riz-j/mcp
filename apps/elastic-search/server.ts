import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { executeSearch, TextResponse } from "./utils";
import { z } from "zod";

const server = new McpServer({
	name: "elastic-search-client",
	version: "1.0.0",
});

server.tool("get-all-clients", { searchTerm: z.string() }, async ({ searchTerm }) => {
	const result = await executeSearch<any>("clients", searchTerm);
	return TextResponse(result.slice(0, 7));
});

server.tool("get-all-tasks", { searchTerm: z.string() }, async ({ searchTerm }) => {
	const result = await executeSearch<any>("tasks", searchTerm);
	return TextResponse(result.slice(0, 7));
});

const transport = new StdioServerTransport();
await server.connect(transport);