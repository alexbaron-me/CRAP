import { config } from 'dotenv'
import { Anthropic } from "@anthropic-ai/sdk";
import { makeClaudeAdapter } from './layers/access/claude.js';

async function main() {
	config()

	const adapter = makeClaudeAdapter()
	const result = await adapter.send([
		{ type: "user", content: "Hello, World!" }
	])

	for (const message of result) {
		console.log(message.content)
	}
}

main()
