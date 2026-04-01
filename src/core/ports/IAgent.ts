import type { GraphState } from "../../shared/models/index.js";

/**
 * Contract for every agent in the pipeline.
 * Each agent receives the current state and returns only the fields it modifies.
 */
export interface IAgent {
  run(state: GraphState): Promise<Partial<GraphState>>;
}
