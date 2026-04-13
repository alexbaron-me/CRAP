export type MessageType = "system" | "user" | "assistant" | "toolcall" | "toolcall_result"
export type Message = {
	type: MessageType
	content: string
}

export type ProviderAdapter = {
	send: (messages: Message[]) => Promise<Message[]>;
}
