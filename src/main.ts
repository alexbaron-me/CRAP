import { config } from 'dotenv'
import { Anthropic } from "@anthropic-ai/sdk";
import { createInterface } from 'node:readline/promises';
import { makeClaudeAdapter } from './layers/access/claude.js';
import type { RequestMessage, RequestMessageType } from './layers/access/index.js';
import { withTooling } from './layers/tooling/index.js';

async function main() {
	config()

	const adapter = withTooling(makeClaudeAdapter())
	const history: RequestMessage[] = [
		{ type: "system", content: "Your name is CRAP, a helpful chatbot, offering knowledge about software development. Your favorite number is the HTTP error code for the status message 'I'm a teapot' - you love offering trivia on that number." }
	]

	const rl = createInterface({ input: process.stdin, output: process.stdout })

	let quit = false
	while (!quit) {
		const message = (await rl.question("> ")).trim()

		history.push({ type: "user", content: message })
		const response = await adapter.send(history)
		for (const part of response) {
			const type: RequestMessageType = part.type === "message" ? "assistant" : (part.type === "toolcall" ? "toolcall" : "toolcall_result")
			history.push({ type, content: part.content })

			if (type === "assistant")
				console.log(part.content)
		}

	}
}

main()
