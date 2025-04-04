export type ToolTextResponse = {
	content: {
		type: "text";
		text: string;
	}[];
}

export function ToolResponse(data: unknown): ToolTextResponse {
	return {
		content: [{ 
			type: "text", 
			text: JSON.stringify(data) 
		}]
	}
}