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
import type { IAgent } from "./types/interfaces.js";

const PipelineState = Annotation.Root({
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

type PipelineStateType = typeof PipelineState.State;

function toNode(agent: IAgent) {
  return (state: PipelineStateType): Promise<Partial<PipelineStateType>> =>
    agent.run(state as GraphState);
}

function afterExtractor(state: PipelineStateType): string {
  if (!state.chunks || state.chunks.length === 0) {
    console.error("[Pipeline] No content extracted from PDF. Aborting.");
    return "end";
  }
  return "analyze";
}

export function buildGraph() {
  const llmProvider = new GeminiProvider();

  const configAgent = new ConfigAgent();
  const extractorAgent = new ExtractorAgent();
  const analyzerAgent = new AnalyzerAgent(llmProvider);
  const qaAgent = new QAAgent(llmProvider);
  const clozeAgent = new ClozeAgent(llmProvider);
  const exporterAgent = new ExporterAgent();

  async function cardGenerationNode(
    state: PipelineStateType,
  ): Promise<Partial<PipelineStateType>> {
    console.log("\n[Pipeline] Running QA and Cloze agents in parallel...");
    const [qaResult, clozeResult] = await Promise.all([
      qaAgent.run(state as GraphState),
      clozeAgent.run(state as GraphState),
    ]);
    return {
      qaCards: qaResult.qaCards ?? [],
      clozeCards: clozeResult.clozeCards ?? [],
    };
  }

  const graph = new StateGraph(PipelineState)
    .addNode("config", toNode(configAgent))
    .addNode("extractor", toNode(extractorAgent))
    .addNode("analyzer", toNode(analyzerAgent))
    .addNode("cardGeneration", cardGenerationNode)
    .addNode("exporter", toNode(exporterAgent))
    .addEdge(START, "config")
    .addEdge("config", "extractor")
    .addConditionalEdges("extractor", afterExtractor, {
      analyze: "analyzer",
      end: END,
    })
    .addEdge("analyzer", "cardGeneration")
    .addEdge("cardGeneration", "exporter")
    .addEdge("exporter", END);

  return graph.compile();
}

export async function runPipeline(
  pdfPath: string,
  deckName: string,
  outputPath: string,
): Promise<GraphState> {
  const app = buildGraph();

  const initialState: Partial<PipelineStateType> = {
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
