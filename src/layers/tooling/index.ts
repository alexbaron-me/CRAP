import { z } from "zod"
import type { ProviderAdapter, RequestMessage } from "../access/index.js";

export type Tool = {
	id: string
	description: string
	inputSchema: z.ZodObject
	outputSchema: z.ZodObject
	handler: (input: z.infer<Tool["inputSchema"]>) => Promise<z.infer<Tool["outputSchema"]>>
}

const pongTool: Tool = {
	id: "pong",
	description: "Responds with {\"response\": \"pong\"}, only if the input is exactly {\"message\": \"ping\"}, serialized as a string. Otherwise, responds with an error.",
	inputSchema: z.object({
		message: z.literal("ping")
	}),
	outputSchema: z.object({
		response: z.literal("pong")
	}),
	handler: () => Promise.resolve({ response: "pong" })
}

const tools: Tool[] = [pongTool]
const toolInfo = tools.map(t => `id=${t.id}: description=${t.description}`).join("; ")

export function withTooling(baseAdapter: ProviderAdapter): ProviderAdapter {
	return {
		...baseAdapter,
		send: async (sourceMessages) => {
			const messages: RequestMessage[] = [
				{ type: "system", content: "You have access to the following tools: " + toolInfo + ' You can call a tool by sending a message of the following pattern: `<toolcall>{"id": TOOL_ID, "input": JSON_INPUT}</toolcall>`. You will receive a JSON response indicating success or failure, containing the tool call result or error message.' }, // TODO: Include tools
				...sourceMessages]

			return baseAdapter.send(messages) // TODO: Handle tool calls in the response
		}
	}
}
