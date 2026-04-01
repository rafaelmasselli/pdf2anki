import type { ChatVertexAI } from "@langchain/google-vertexai";

/**
 * Contract for LLM providers.
 * Typed to ChatVertexAI to preserve withStructuredOutput support (DIP).
 */
export interface ILLMProvider {
  getModel(): ChatVertexAI;
}
