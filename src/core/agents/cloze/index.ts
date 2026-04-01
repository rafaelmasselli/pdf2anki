import type { IAgent, ILLMProvider } from "../../ports/index.js";
import type { GraphState, ClozeCard } from "../../../shared/models/index.js";
import { clozePrompt } from "./prompt.js";
import { clozeSchema } from "./schema.js";

export class ClozeAgent implements IAgent {
  constructor(private readonly llmProvider: ILLMProvider) {}

  async run(state: GraphState): Promise<Partial<GraphState>> {
    console.log(
      `\n[ClozeAgent] Generating Cloze cards for ${state.chunks.length} chunk(s)...`,
    );

    const chain = clozePrompt.pipe(
      this.llmProvider.getModel().withStructuredOutput(clozeSchema),
    );

    const allCards: ClozeCard[] = [];
    const contextVars = this.buildContextVars(state);

    for (let i = 0; i < state.chunks.length; i++) {
      console.log(
        `[ClozeAgent] Processing chunk ${i + 1}/${state.chunks.length}`,
      );
      try {
        const result = await chain.invoke({
          text: state.chunks[i],
          ...contextVars,
        });
        allCards.push(...result.cards);
      } catch (err) {
        console.warn(`[ClozeAgent] Failed to process chunk ${i + 1}:`, err);
      }
    }

    console.log(`[ClozeAgent] Generated ${allCards.length} Cloze card(s)`);
    return { clozeCards: allCards };
  }

  private buildContextVars(state: GraphState) {
    const { language, level, goal, additionalNotes } = state.studyContext;
    const { language: docLanguage, topic: docTopic, keyConcepts: docKeyConcepts, summary: docSummary } = state.documentSummary;
    return { language, level, goal, additionalNotes, docLanguage, docTopic, docKeyConcepts, docSummary };
  }
}
