export type RequestMessageType = "system" | "user"
export type RequestMessage = {
	type: RequestMessageType
	content: string
}

export type ResponseMessageType = "message" // in the future: toolcalls etc.
export type ResponseMessage = {
	type: ResponseMessageType
	content: string
}

export type ProviderAdapter = {
	send: (messages: RequestMessage[]) => Promise<ResponseMessage[]>;
}
