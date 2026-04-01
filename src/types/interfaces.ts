import type { GraphState } from "./state.js";
import type { ChatVertexAI } from "@langchain/google-vertexai";

/**
 * Contract for every agent in the pipeline.
 * Each agent receives the current state and returns only the fields it modifies.
 */
export interface IAgent {
  run(state: GraphState): Promise<Partial<GraphState>>;
}

/**
 * Contract for LLM providers.
 * Typed to ChatVertexAI to preserve withStructuredOutput support (DIP).
 */
export interface ILLMProvider {
  getModel(): ChatVertexAI;
}
