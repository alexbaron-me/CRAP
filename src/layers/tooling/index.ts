import { z } from "zod"
import type { ProviderAdapter, RequestMessage } from "../access/index.js";
import { assert } from "node:console";
import { readdir, stat, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

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
const lsTool: Tool = {
	id: "ls",
	description: "Lists all files in a folder, defaulting to the current work directory if no path is given",
	inputSchema: z.object({
		path: z.string().optional()
	}),
	outputSchema: z.object({
		path: z.string(),
		items: z.array(z.object({
			name: z.string(),
			type: z.union([z.literal("file"), z.literal("folder")])
		}))
	}),
	handler: async param => { // TODO: Fix imprecise typing
		const { path = "." } = param as { path?: string }

		const dirents = await readdir(path)
		return {
			path: resolve(path),
			items: await Promise.all(dirents.map(async name => ({
				name,
				type: await stat(resolve(path, name)).then(stats => stats.isDirectory() ? "folder" : "file").catch(() => "file") // TODO: Handle errors properly
			})))
		}
	}
}
const readFileTool: Tool = {
	id: "read_file",
	description: "Reads the content of a file given its path",
	inputSchema: z.object({
		path: z.string()
	}),
	outputSchema: z.object({
		content: z.string()
	}),
	handler: async param => {
		const { path } = param as { path: string }
		return {
			content: await readFile(path, "utf-8")
		}
	}
}
const writeFileTool: Tool = {
	id: "write_file",
	description: "Writes content to a file at a given path. If the file already exists, it will be overwritten.",
	inputSchema: z.object({
		path: z.string(),
		content: z.string()
	}),
	outputSchema: z.object({
		success: z.boolean()
	}),
	handler: async param => {
		const { path, content } = param as { path: string, content: string }
		await writeFile(path, content, "utf-8")
		return { success: true }
	}
}

const tools: Tool[] = [pongTool, lsTool, readFileTool, writeFileTool]
const toolInfo = tools.map(t => `id=${t.id}: description=${t.description}`).join("; ")

const toolCallSchema = z.object({
	id: z.string(),
	input: z.record(z.string(), z.unknown())
})

export function withTooling(baseAdapter: ProviderAdapter): ProviderAdapter {
	return {
		...baseAdapter,
		send: async (sourceMessages) => {
			const messages: RequestMessage[] = [
				{ type: "system", content: "You have access to the following tools: " + toolInfo + ' You can call a tool by sending a message of the following pattern: `<toolcall>{"id": TOOL_ID, "input": JSON_INPUT}</toolcall>`. Do not add any additional text, your entire response must not contain anything but the toolcall. You will receive a JSON response wrapped in `<toolcall_result>` indicating success or failure, containing the tool call result or error message.' }, // TODO: Include tools
				...sourceMessages]

			const responses = await baseAdapter.send(messages)
			assert(responses.length === 1)
			const response = responses[0]

			if (response.type === "message" &&
				(!response.content.startsWith("<toolcall>") || !response.content.endsWith("</toolcall>")))
				return [response]

			const toolcallContent = response.content.slice("<toolcall>".length, -"</toolcall>".length)
			const parseResult = toolCallSchema.safeParse(JSON.parse(toolcallContent))
			if (!parseResult.success) throw new Error(`Received invalid toolcall: ${parseResult.error.message}`)

			const tool = tools.find(t => t.id === parseResult.data.id)
			if (!tool) throw new Error(`Received toolcall for unknown tool ${parseResult.data.id}`)
			const input = tool.inputSchema.safeParse(parseResult.data.input)
			if (!input.success) throw new Error(`Received invalid toolcall parameters for tool '${tool.id}': ${input.error.message}`)

			console.log(`\tReceived toolcall for id=${tool.id} with parameters=${JSON.stringify(input.data)}`)
			const result = await tool.handler(input.data)
			console.log(`\tTool responed with response=${JSON.stringify(result)}`)
			// TODO: Send errors to LLM
			// TODO: Handle followup toolcalls

			const followupResponse = await baseAdapter.send([...messages,
			{
				type: "assistant",
				content: response.content
			}, {
				type: "toolcall",
				content: `<toolcall_result>${JSON.stringify(result)}</toolcall_result>`
			}])
			assert(followupResponse.length === 1)

			return [{
				type: "toolcall",
				content: response.content
			}, {
				type: "toolcall_result",
				content: `<toolcall_result>${JSON.stringify(result)}</toolcall_result>`
			}, { type: "message", content: followupResponse[0].content }
			];
		}
	}
}
