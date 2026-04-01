import { createLLM } from "../../lib/llm.js";
import { qaPrompt } from "./prompt.js";
import { qaSchema } from "./schema.js";
import type { GraphState, QACard } from "../../types/state.js";

export async function qaAgent(state: GraphState): Promise<Partial<GraphState>> {
  console.log(
    `\n[QAAgent] Generating Q&A cards for ${state.chunks.length} chunk(s)...`,
  );

  const llm = createLLM();
  const chain = qaPrompt.pipe(llm.withStructuredOutput(qaSchema));
  const allCards: QACard[] = [];

  for (let i = 0; i < state.chunks.length; i++) {
    console.log(`[QAAgent] Processing chunk ${i + 1}/${state.chunks.length}`);
    try {
      const result = await chain.invoke({ text: state.chunks[i] });
      allCards.push(...result.cards);
    } catch (err) {
      console.warn(`[QAAgent] Failed to process chunk ${i + 1}:`, err);
    }
  }

  console.log(`[QAAgent] Generated ${allCards.length} Q&A card(s)`);
  return { qaCards: allCards };
}
