import { assert } from '../../lib/assert'
import { ChatAgent } from '../base'
import { logChatMessage } from '../logger'
import { ChatFunction, ChatMessage, ChatResponse } from '../types'
import { fetchApi } from './client'
import { normalizeChatMessage } from './helpers'
import { OpenAIChatCompletion } from './types'

export interface OpenApiAgentOptions {
  model?: 'gpt-3.5-turbo-0613' | 'gpt-4-0613' | 'gpt-4' | 'gpt-3.5-turbo'
  temperature?: number
  apiKey?: string
  verbose?: boolean
}

export class OpenAiAgent extends ChatAgent {
  model: string
  temperature: number
  apiKey: string | undefined

  constructor({
    model = 'gpt-4-0613',
    temperature = 0,
    apiKey,
    verbose = false,
  }: OpenApiAgentOptions = {}) {
    super({ verbose })

    this.model = model
    this.temperature = temperature
    this.apiKey = apiKey
  }

  async call({
    messages,
    functions,
    functionCall,
  }: {
    messages: ChatMessage[]
    functions?: ChatFunction[]
    functionCall?: string
  }): Promise<ChatResponse> {
    this.onRequest({ messages, functions })

    const response = await fetchApi<OpenAIChatCompletion>(`/chat/completions`, {
      method: 'POST',
      body: {
        model: this.model,
        temperature: this.temperature,
        messages,
        functions,
        function_call: functionCall ? { name: functionCall } : undefined,
      },
      apiKey: this.apiKey,
    })

    assert(response.choices.length === 1, 'Expected response.choices to be 1')

    const [choice] = response.choices
    const message = normalizeChatMessage(choice.message)

    this.onResponse(message)

    return message
  }

  protected onRequest({
    messages,
    functions,
  }: {
    messages: ChatMessage[]
    functions?: ChatFunction[]
  }) {
    this.log({ messages, functions })
  }

  protected onResponse(message: ChatResponse) {
    this.log({ messages: [message] })
  }

  protected log({
    messages,
    functions,
  }: {
    messages: ChatMessage[]
    functions?: ChatFunction[]
  }) {
    if (!this.verbose) {
      return
    }

    // TODO incoming/outgoing

    messages.forEach(logChatMessage)

    // Todo
    console.log(functions)
  }
}
