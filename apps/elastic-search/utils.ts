export type ITextResponse = {
	content: {
		type: "text";
		text: string;
	}[];
}

export function TextResponse(data: unknown): ITextResponse {
	return {
		content: [{ 
			type: "text", 
			text: JSON.stringify(data) 
		}]
	}
}

export interface SerachResult<T> {
	_id: string;
	_index: string;
	_type: string;
	_score: number;
	_source: T;
}

export async function executeSearch<T>(searchTerm: string): Promise<Array<SerachResult<T>>> {
	const response = await fetch("http://localhost:9201/clients/_search", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			query: {
				query_string: {
					query: searchTerm
				}
			}
		})
	});

	const result = await response.json() as any;
	return result.hits.hits;
}