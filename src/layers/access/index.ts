// TODO: Merge `RequestMessageType` and `ResponseMessageType`

export type RequestMessageType = "system" | "user" | "assistant" | "toolcall" | "toolcall_result"
export type RequestMessage = {
	type: RequestMessageType
	content: string
}

export type ResponseMessageType = "message" | "toolcall" | "toolcall_result"
export type ResponseMessage = {
	type: ResponseMessageType
	content: string
}

export type ProviderAdapter = {
	send: (messages: RequestMessage[]) => Promise<ResponseMessage[]>;
}
