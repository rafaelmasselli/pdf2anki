import pLimit from "p-limit";
import type { IAgent, ILLMProvider } from "../../ports/index.js";
import type { GraphState, DocumentSummary } from "../../../shared/models/index.js";
import { analyzerPrompt, chunkSummaryPrompt, reducePrompt } from "./prompt.js";
import { analyzerSchema } from "./schema.js";

/** Maximum number of chunks sent in a single LLM call before switching to map-reduce. */
const MAP_REDUCE_THRESHOLD = 10;

/** Maximum concurrent LLM calls during the map phase. */
const MAP_CONCURRENCY = 5;

export class AnalyzerAgent implements IAgent {
  constructor(private readonly llmProvider: ILLMProvider) {}

  async run(state: GraphState): Promise<Partial<GraphState>> {
    console.log("\n[AnalyzerAgent] Analyzing full document...");

    const documentSummary =
      state.chunks.length <= MAP_REDUCE_THRESHOLD
        ? await this.analyzeDirect(state.chunks)
        : await this.analyzeMapReduce(state.chunks);

    console.log(`[AnalyzerAgent] Document language : ${documentSummary.language}`);
    console.log(`[AnalyzerAgent] Topic             : ${documentSummary.topic}`);
    console.log(`[AnalyzerAgent] Key concepts      : ${documentSummary.keyConcepts}`);
    console.log(`[AnalyzerAgent] Modules           : ${documentSummary.modules.join(" | ")}`);

    return { documentSummary };
  }

  private async analyzeDirect(chunks: string[]): Promise<DocumentSummary> {
    const fullText = chunks.join("\n\n");
    const chain = analyzerPrompt.pipe(
      this.llmProvider.getModel().withStructuredOutput(analyzerSchema),
    );
    return chain.invoke({ fullText });
  }

  private async analyzeMapReduce(chunks: string[]): Promise<DocumentSummary> {
    console.log(
      `[AnalyzerAgent] Large document (${chunks.length} chunks) — using map-reduce strategy`,
    );

    const limit = pLimit(MAP_CONCURRENCY);
    const model = this.llmProvider.getModel();

    const partials = await Promise.all(
      chunks.map((chunk, i) =>
        limit(async () => {
          console.log(`[AnalyzerAgent] Summarizing chunk ${i + 1}/${chunks.length}`);
          const chain = chunkSummaryPrompt.pipe(model);
          const response = await chain.invoke({ chunkText: chunk });
          return typeof response.content === "string" ? response.content : String(response.content);
        }),
      ),
    );

    const partialSummaries = partials.map((s, i) => `--- Section ${i + 1} ---\n${s}`).join("\n\n");

    console.log(`[AnalyzerAgent] Reducing ${partials.length} partial summaries...`);
    const reduceChain = reducePrompt.pipe(model.withStructuredOutput(analyzerSchema));
    return reduceChain.invoke({ partialSummaries });
  }
}
