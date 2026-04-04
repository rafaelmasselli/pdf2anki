import type { IAgent, ILLMProvider } from "../../ports/index.js";
import type { GraphState, QACard } from "../../../shared/models/index.js";
import { qaPrompt } from "./prompt.js";
import { qaSchema } from "./schema.js";

export class QAAgent implements IAgent {
  constructor(private readonly llmProvider: ILLMProvider) {}

  async run(state: GraphState): Promise<Partial<GraphState>> {
    console.log(`\n[QAAgent] Generating Q&A cards for ${state.chunks.length} chunk(s)...`);

    const chain = qaPrompt.pipe(this.llmProvider.getModel().withStructuredOutput(qaSchema));
    const contextVars = this.buildContextVars(state);

    const results = await Promise.all(
      state.chunks.map((chunk, i) => {
        console.log(`[QAAgent] Processing chunk ${i + 1}/${state.chunks.length}`);
        return chain
          .invoke({ text: chunk, ...contextVars })
          .then((result) => result.cards as QACard[])
          .catch((err) => {
            console.warn(`[QAAgent] Failed to process chunk ${i + 1}:`, err);
            return [] as QACard[];
          });
      }),
    );

    const qaCards = results.flat();
    console.log(`[QAAgent] Generated ${qaCards.length} Q&A card(s)`);
    return { qaCards };
  }

  private buildContextVars(state: GraphState) {
    const { language, level, goal, additionalNotes } = state.studyContext;
    const {
      language: docLanguage,
      topic: docTopic,
      keyConcepts: docKeyConcepts,
      summary: docSummary,
    } = state.documentSummary;
    return { language, level, goal, additionalNotes, docLanguage, docTopic, docKeyConcepts, docSummary };
  }
}
