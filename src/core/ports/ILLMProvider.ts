import type { BaseChatModel } from "@langchain/core/language_models/chat_models";

/**
 * Contract for LLM providers.
 * Returns a generic BaseChatModel so the core layer has no dependency on any
 * specific provider (Vertex, OpenAI, Anthropic, etc.).
 */
export interface ILLMProvider {
  getModel(): BaseChatModel;
}
