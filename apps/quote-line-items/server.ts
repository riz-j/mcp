// \\wsl.localhost\Debian\home\rizki\Code\mcp\apps\mssql\server.ts

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import sql from "mssql";
import { TextResponse } from "./utils";

const sqlConfig = {
	user: "imsdev",
	password: "imsconnect",
	database: "hal",
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

const QUOTE_ID = 15102;
const CONTROLLING_ORG_ID = 163803;

const server = new McpServer({
	name: "mssql-mcp",
	version: "1.0.0",
});

server.tool("get-all-quote-line-items", { start: z.boolean() }, async () => {
	const result = await sql.query(`
		SELECT qli.Line_Item_id AS id
			,qli.item AS 'name'
			,qli.qty AS quantity
			,qli.Costex AS cost
			,qli.markup
			,qli.unitSell AS sell
		FROM qte_line_item qli
		WHERE qli.Quote_id = ${QUOTE_ID}
			AND qli.Primary_org_Id = ${CONTROLLING_ORG_ID};
	`);

	return TextResponse(result.recordset);
});

server.tool(
	"bulk-update-quote-line-item",
	{ items: z.array(z.object({
		id: z.number(),
		name: z.string().nullable(),
		quantity: z.number().nullable(),
		cost: z.number().nullable(),
		markup: z.enum(["10", "20", "30", "40", "50"]).nullable(),
	})) },
	async ({ items }) => {
		for (const item of items) {
			await sql.query(`
				UPDATE qte_line_item
				SET item = '${item.name}'
					, qty = ${item.quantity}
					, Costex = ${item.cost}
					, markup = ${item.markup}
				WHERE Line_Item_id = ${item.id}
					AND Quote_id = ${QUOTE_ID}
					AND Primary_org_Id = ${CONTROLLING_ORG_ID};

				UPDATE qte_line_item
				SET unitSell = (CostEx + (CostEx * markup / 100))
				WHERE Line_Item_id = ${item.id}
					AND Quote_id = ${QUOTE_ID}
					AND Primary_org_Id = ${CONTROLLING_ORG_ID};
			`);
		}

		return TextResponse("Items have been updated");
	}
);

server.tool(
	"bulk-create-quote-line-item",
	{ items: z.array(z.object({
		name: z.string(),
		quantity: z.number(),
		cost: z.number(),
		markup: z.enum(["10", "20", "30", "40", "50"]),
		type: z.enum(["material", "labour"])
	})) },
	async ({ items }) => {
		for (const item of items) {
			await sql.query(`
				INSERT INTO qte_line_item (
					Quote_id
					, Primary_org_Id
					, item
					, qty
					, Costex
					, markup
					, unitSell
					, itemType
				) VALUES (
					${QUOTE_ID}
					, ${CONTROLLING_ORG_ID}
					, '${item.name}'
					, ${item.quantity}
					, ${item.cost}
					, ${item.markup}
					, ${item.cost + (item.cost * parseInt(item.markup) / 100)}
					, '${item.type === "labour" ? 0 : 1}'
				);
			`);
		}

		return TextResponse("Items successfully inserted");
	}
);

server.tool(
	"delete-some-quote-line-items",
	{ ids: z.array(z.number()) },
	async ({ ids }) => {
		for (const id of ids) {
			await sql.query(`
				DELETE FROM qte_line_item
				WHERE Line_Item_id = ${id}
					AND Quote_id = ${QUOTE_ID}
					AND Primary_org_Id = ${CONTROLLING_ORG_ID};
			`);
		}

		return TextResponse("Items have been deleted");
	}
)

server.tool("delete-all-quote-line-items", { execute: z.boolean() }, async () => {
	await sql.query(`
		DELETE FROM qte_line_item
		WHERE Quote_id = ${QUOTE_ID}
			AND Primary_org_Id = ${CONTROLLING_ORG_ID};
	`)

	return TextResponse("Items have been deleted");
})

const transport = new StdioServerTransport();
await server.connect(transport);