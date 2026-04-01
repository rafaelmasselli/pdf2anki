import type { IAgent, ILLMProvider } from "../../ports/index.js";
import type { GraphState, QACard } from "../../../shared/models/index.js";
import { qaPrompt } from "./prompt.js";
import { qaSchema } from "./schema.js";

export class QAAgent implements IAgent {
  constructor(private readonly llmProvider: ILLMProvider) {}

  async run(state: GraphState): Promise<Partial<GraphState>> {
    console.log(
      `\n[QAAgent] Generating Q&A cards for ${state.chunks.length} chunk(s)...`,
    );

    const chain = qaPrompt.pipe(
      this.llmProvider.getModel().withStructuredOutput(qaSchema),
    );

    const allCards: QACard[] = [];
    const contextVars = this.buildContextVars(state);

    for (let i = 0; i < state.chunks.length; i++) {
      console.log(`[QAAgent] Processing chunk ${i + 1}/${state.chunks.length}`);
      try {
        const result = await chain.invoke({
          text: state.chunks[i],
          ...contextVars,
        });
        allCards.push(...result.cards);
      } catch (err) {
        console.warn(`[QAAgent] Failed to process chunk ${i + 1}:`, err);
      }
    }

    console.log(`[QAAgent] Generated ${allCards.length} Q&A card(s)`);
    return { qaCards: allCards };
  }

  private buildContextVars(state: GraphState) {
    const { language, level, goal, additionalNotes } = state.studyContext;
    const { language: docLanguage, topic: docTopic, keyConcepts: docKeyConcepts, summary: docSummary } = state.documentSummary;
    return { language, level, goal, additionalNotes, docLanguage, docTopic, docKeyConcepts, docSummary };
  }
}
