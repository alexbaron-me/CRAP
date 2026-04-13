import { config } from 'dotenv'
import { Anthropic } from "@anthropic-ai/sdk";
import { createInterface } from 'node:readline/promises';
import { makeClaudeAdapter } from './claude.js';
import type { Message, MessageType } from './access.js';
import { withTooling } from './tooling.js';

async function main() {
	config()

	const adapter = withTooling(makeClaudeAdapter())
	const history: Message[] = [
		{ type: "system", content: "Your name is CRAP, a helpful chatbot, offering knowledge about software development. Your favorite number is the HTTP error code for the status message 'I'm a teapot' - you love offering trivia on that number." }
	]

	const rl = createInterface({ input: process.stdin, output: process.stdout })

	let quit = false
	while (!quit) {
		const message = (await rl.question("> ")).trim()

		history.push({ type: "user", content: message })
		const response = await adapter.send(history)
		for (const part of response) {
			history.push(part)

			if (part.type === "assistant")
				console.log(part.content)
		}

	}
}

main()
