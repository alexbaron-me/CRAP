import Anthropic from "@anthropic-ai/sdk";
import { MessageParam, MessageStreamParams } from "@anthropic-ai/sdk/resources";
import { ProviderAdapter, RequestMessage, ResponseMessage } from "./index.js";

function denormalizeRequestMessage(message: RequestMessage): MessageParam {
	if (message.type === "user" || message.type === "toolcall") {
		return { role: "user", content: message.content }
	}
	if (message.type === "assistant" || message.type === "toolcall_result") {
		return { role: "assistant", content: message.content }
	}

	throw new Error(`Unable to convert message type ${message.type} to Anthropic message`)
}

function normalizeResponseMessage(message: Anthropic.Messages.ContentBlock): ResponseMessage {
	if (message.type === "text") {
		return { type: "message", content: message.text }
	}

	throw new Error(`Unable to convert message type ${message.type} to ResponseMessage`)
}

// Extracts the system prompt since Anthropic API needs it to be separate from chat history
function parseMessages(messagesRaw: RequestMessage[]): { system: { type: "text"; text: string }[]; messages: MessageParam[] } {
	const system = messagesRaw.filter(m => m.type === "system").map(m => ({ type: "text" as const, text: m.content }))
	const messages = messagesRaw.filter(m => m.type !== "system").map(denormalizeRequestMessage)

	return { system, messages }
}

export function makeClaudeAdapter(): ProviderAdapter {
	const client = new Anthropic({
		baseURL: "https://gateway.ai.itestra.com"
	});

	return {
		send: async (messagesRaw) => {
			const { system, messages } = parseMessages(messagesRaw)

			const response = await client.messages.create({
				max_tokens: 1024, // TODO: What are the implications of this?
				model: "devstral-small-2", // TODO: Surface options
				system,
				messages
			})

			// TODO: Surface toolcalls etc.
			const content = response.content.filter(block => block.type === "text").map(block => block.text).join("")
			return [{ type: "message" as const, content }]
		}
	}
}
