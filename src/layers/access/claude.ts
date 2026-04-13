import Anthropic from "@anthropic-ai/sdk";
import { MessageStreamParams } from "@anthropic-ai/sdk/resources";
import { ProviderAdapter, RequestMessage, ResponseMessage } from "./index.js";

function denormalizeRequestMessage(message: RequestMessage) {
	if (message.type === "user") {
		return { role: "user" as const, content: message.content }
	}

	throw new Error(`Unable to convert message type ${message.type} to Anthropic message`)
}

function normalizeResponseMessage(message: Anthropic.Messages.ContentBlock): ResponseMessage {
	if (message.type === "text") {
		return { type: "message", content: message.text }
	}

	throw new Error(`Unable to convert message type ${message.type} to ResponseMessage`)
}

export function makeClaudeAdapter(): ProviderAdapter {
	const client = new Anthropic({
		baseURL: "https://gateway.ai.itestra.com"
	});

	return {
		send: async (messages) => {
			const response = await client.messages.create({
				max_tokens: 1024, // TODO: What are the implications of this?
				model: "devstral-small-2", // TODO: Surface options
				messages: messages.map(denormalizeRequestMessage)
			})

			return response.content.map(normalizeResponseMessage)
		}
	}
}
