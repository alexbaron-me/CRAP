import { z } from "zod"
import type { ProviderAdapter, RequestMessage } from "../access/index.js";

export type Tool = {
	id: string
	description: string
	inputSchema: z.ZodObject
	outputSchema: z.ZodObject
}

export function withTooling(baseAdapter: ProviderAdapter): ProviderAdapter {
	return {
		...baseAdapter,
		send: async (sourceMessages) => {
			const messages: RequestMessage[] = [
				{ type: "system", content: "You have access to the following tools:" }, // TODO: Include tools
				...sourceMessages]

			return baseAdapter.send(messages) // TODO: Handle tool calls in the response
		}
	}
}
