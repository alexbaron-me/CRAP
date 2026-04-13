import { config } from 'dotenv'
import { Anthropic } from "@anthropic-ai/sdk";

async function main() {
	config()

	const client = new Anthropic({
		baseURL: "https://gateway.ai.itestra.com"
	});

	const stream = await client.messages.stream({
		max_tokens: 1024,
		messages: [{ role: "user", content: "Hello there!" }],
		model: "devstral-small-2",
		stream: true
	}).on("text", (text) => process.stdout.write(text));

	const message = await stream.finalMessage();
	console.log(`\n${message.usage.input_tokens} input tokens, ${message.usage.output_tokens} output tokens`);
}

main()
