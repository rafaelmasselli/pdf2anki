import type { IAgent, ILLMProvider } from "../../ports/index.js";
import type { GraphState, ClozeCard } from "../../../shared/models/index.js";
import { clozePrompt } from "./prompt.js";
import { clozeSchema } from "./schema.js";

export class ClozeAgent implements IAgent {
  constructor(private readonly llmProvider: ILLMProvider) {}

  async run(state: GraphState): Promise<Partial<GraphState>> {
    console.log(`\n[ClozeAgent] Generating Cloze cards for ${state.chunks.length} chunk(s)...`);

    const chain = clozePrompt.pipe(this.llmProvider.getModel().withStructuredOutput(clozeSchema));
    const contextVars = this.buildContextVars(state);

    const results = await Promise.all(
      state.chunks.map((chunk, i) => {
        console.log(`[ClozeAgent] Processing chunk ${i + 1}/${state.chunks.length}`);
        return chain
          .invoke({ text: chunk, ...contextVars })
          .then((result) =>
            result.cards.map((card) => ({ text: this.normalizeCloze(card.text) }) as ClozeCard),
          )
          .catch((err) => {
            console.warn(`[ClozeAgent] Failed to process chunk ${i + 1}:`, err);
            return [] as ClozeCard[];
          });
      }),
    );

    const clozeCards = results.flat();
    console.log(`[ClozeAgent] Generated ${clozeCards.length} Cloze card(s)`);
    return { clozeCards };
  }

  private normalizeCloze(text: string): string {
    return text.replace(/\{+?(c\d+::[^}]+?)\}+/g, "{{$1}}");
  }

  private buildContextVars(state: GraphState) {
    const { language, level, goal, additionalNotes } = state.studyContext;
    const {
      language: docLanguage,
      topic: docTopic,
      keyConcepts: docKeyConcepts,
      summary: docSummary,
    } = state.documentSummary;
    return {
      language,
      level,
      goal,
      additionalNotes,
      docLanguage,
      docTopic,
      docKeyConcepts,
      docSummary,
    };
  }
}
