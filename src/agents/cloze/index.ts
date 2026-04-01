import { createLLM } from "../../lib/llm.js";
import { clozePrompt } from "./prompt.js";
import { clozeSchema } from "./schema.js";
import type { GraphState, ClozeCard } from "../../types/state.js";

export async function clozeAgent(
  state: GraphState,
): Promise<Partial<GraphState>> {
  console.log(
    `\n[ClozeAgent] Generating Cloze cards for ${state.chunks.length} chunk(s)...`,
  );

  const llm = createLLM();
  const chain = clozePrompt.pipe(llm.withStructuredOutput(clozeSchema));
  const allCards: ClozeCard[] = [];

  for (let i = 0; i < state.chunks.length; i++) {
    console.log(
      `[ClozeAgent] Processing chunk ${i + 1}/${state.chunks.length}`,
    );
    try {
      const result = await chain.invoke({ text: state.chunks[i] });
      allCards.push(...result.cards);
    } catch (err) {
      console.warn(`[ClozeAgent] Failed to process chunk ${i + 1}:`, err);
    }
  }

  console.log(`[ClozeAgent] Generated ${allCards.length} Cloze card(s)`);
  return { clozeCards: allCards };
}
