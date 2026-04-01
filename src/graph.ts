import { StateGraph, END, START } from "@langchain/langgraph";
import { Annotation } from "@langchain/langgraph";
import {
  ConfigAgent,
  ExtractorAgent,
  AnalyzerAgent,
  QAAgent,
  ClozeAgent,
  ExporterAgent,
} from "./agents/index.js";
import { GeminiProvider } from "./lib/llm.js";
import type {
  GraphState,
  QACard,
  ClozeCard,
  StudyContext,
  DocumentSummary,
} from "./types/state.js";
import type { IAgent, ILLMProvider } from "./types/interfaces.js";

export class Pipeline {
  private static readonly state = Annotation.Root({
    pdfPath: Annotation<string>(),
    deckName: Annotation<string>(),
    studyContext: Annotation<StudyContext>({
      default: () => ({
        language: "same as PDF",
        level: "undergraduate",
        goal: "general review",
        additionalNotes: "none",
      }),
      reducer: (_, next) => next,
    }),
    documentSummary: Annotation<DocumentSummary>({
      default: () => ({
        language: "unknown",
        topic: "",
        keyConcepts: "",
        summary: "",
      }),
      reducer: (_, next) => next,
    }),
    chunks: Annotation<string[]>({
      default: () => [],
      reducer: (_, next) => next,
    }),
    totalPages: Annotation<number>({
      default: () => 0,
      reducer: (_, next) => next,
    }),
    qaCards: Annotation<QACard[]>({
      default: () => [],
      reducer: (_, next) => next,
    }),
    clozeCards: Annotation<ClozeCard[]>({
      default: () => [],
      reducer: (_, next) => next,
    }),
    outputPath: Annotation<string>(),
    error: Annotation<string | undefined>({
      default: () => undefined,
      reducer: (_, next) => next,
    }),
  });

  private readonly llmProvider: ILLMProvider;
  private readonly configAgent: IAgent;
  private readonly extractorAgent: IAgent;
  private readonly analyzerAgent: IAgent;
  private readonly qaAgent: QAAgent;
  private readonly clozeAgent: ClozeAgent;
  private readonly exporterAgent: IAgent;

  constructor() {
    this.llmProvider = new GeminiProvider();
    this.configAgent = new ConfigAgent();
    this.extractorAgent = new ExtractorAgent();
    this.analyzerAgent = new AnalyzerAgent(this.llmProvider);
    this.qaAgent = new QAAgent(this.llmProvider);
    this.clozeAgent = new ClozeAgent(this.llmProvider);
    this.exporterAgent = new ExporterAgent();
  }

  async run(
    pdfPath: string,
    deckName: string,
    outputPath: string,
  ): Promise<GraphState> {
    const app = this.buildGraph();

    const initialState: Partial<typeof Pipeline.state.State> = {
      pdfPath,
      deckName,
      outputPath,
      chunks: [],
      qaCards: [],
      clozeCards: [],
    };

    console.log("\n=== PDF to Anki Pipeline ===");
    console.log(`PDF:    ${pdfPath}`);
    console.log(`Deck:   ${deckName}`);
    console.log(`Output: ${outputPath}`);

    const result = await app.invoke(initialState);
    return result as GraphState;
  }

  private buildGraph() {
    return new StateGraph(Pipeline.state)
      .addNode("config", this.toNode(this.configAgent))
      .addNode("extractor", this.toNode(this.extractorAgent))
      .addNode("analyzer", this.toNode(this.analyzerAgent))
      .addNode("cardGeneration", this.cardGenerationNode.bind(this))
      .addNode("exporter", this.toNode(this.exporterAgent))
      .addEdge(START, "config")
      .addEdge("config", "extractor")
      .addConditionalEdges("extractor", this.afterExtractor, {
        analyze: "analyzer",
        end: END,
      })
      .addEdge("analyzer", "cardGeneration")
      .addEdge("cardGeneration", "exporter")
      .addEdge("exporter", END)
      .compile();
  }

  private toNode(agent: IAgent) {
    return (
      state: typeof Pipeline.state.State,
    ): Promise<Partial<typeof Pipeline.state.State>> =>
      agent.run(state as GraphState);
  }

  private afterExtractor(state: typeof Pipeline.state.State): string {
    if (!state.chunks || state.chunks.length === 0) {
      console.error("[Pipeline] No content extracted from PDF. Aborting.");
      return "end";
    }
    return "analyze";
  }

  private async cardGenerationNode(
    state: typeof Pipeline.state.State,
  ): Promise<Partial<typeof Pipeline.state.State>> {
    console.log("\n[Pipeline] Running QA and Cloze agents in parallel...");
    const [qaResult, clozeResult] = await Promise.all([
      this.qaAgent.run(state as GraphState),
      this.clozeAgent.run(state as GraphState),
    ]);
    return {
      qaCards: qaResult.qaCards ?? [],
      clozeCards: clozeResult.clozeCards ?? [],
    };
  }
}
