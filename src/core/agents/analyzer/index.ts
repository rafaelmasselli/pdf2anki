import type { IAgent, ILLMProvider } from "../../ports/index.js";
import type { GraphState, DocumentSummary } from "../../../shared/models/index.js";
import { analyzerPrompt } from "./prompt.js";
import { analyzerSchema } from "./schema.js";

export class AnalyzerAgent implements IAgent {
  constructor(private readonly llmProvider: ILLMProvider) {}

  async run(state: GraphState): Promise<Partial<GraphState>> {
    console.log("\n[AnalyzerAgent] Analyzing full document...");

    const fullText = state.chunks.join("\n\n");
    const chain = analyzerPrompt.pipe(
      this.llmProvider.getModel().withStructuredOutput(analyzerSchema),
    );

    const result = await chain.invoke({ fullText });

    const documentSummary: DocumentSummary = {
      language: result.language,
      topic: result.topic,
      keyConcepts: result.keyConcepts,
      summary: result.summary,
      modules: result.modules,
    };

    console.log(`[AnalyzerAgent] Document language : ${documentSummary.language}`);
    console.log(`[AnalyzerAgent] Topic             : ${documentSummary.topic}`);
    console.log(`[AnalyzerAgent] Key concepts      : ${documentSummary.keyConcepts}`);
    console.log(`[AnalyzerAgent] Modules           : ${documentSummary.modules.join(" | ")}`);

    return { documentSummary };
  }
}
