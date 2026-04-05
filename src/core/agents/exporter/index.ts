import { dirname } from "path";
import type { IAgent, IAnkiDeckService } from "../../ports/index.js";
import type { GraphState, SaveDeckDTO } from "../../../shared/models/index.js";
import { AnkiDeckService } from "../../../services/index.js";

export class ExporterAgent implements IAgent {
  private readonly deckService: IAnkiDeckService;

  constructor(deckService: IAnkiDeckService = new AnkiDeckService()) {
    this.deckService = deckService;
  }

  async run(state: GraphState): Promise<Partial<GraphState>> {
    const { qaCards, clozeCards, outputPath } = state;
    const topic = state.documentSummary?.topic;
    const modules = state.documentSummary?.modules ?? [];

    const deckName = topic ? this.topicToDeckName(topic) : state.deckName;
    const resolvedOutputPath = topic
      ? `${dirname(outputPath)}/${this.topicToFilename(topic)}.apkg`
      : outputPath;

    console.log(`\n[ExporterAgent] Building Anki deck: "${deckName}"`);
    console.log(
      `[ExporterAgent] Q&A cards: ${qaCards.length} | Cloze cards: ${clozeCards.length} | Total: ${qaCards.length + clozeCards.length}`,
    );

    const dto: SaveDeckDTO = {
      deckName,
      outputPath: resolvedOutputPath,
      qaCards,
      clozeCards,
      modules,
    };
    const { savedPaths } = await this.deckService.save(dto);

    for (const path of savedPaths) {
      console.log(`[ExporterAgent] Saved: ${path}`);
    }

    return { outputPath: savedPaths[0] };
  }

  private topicToDeckName(topic: string): string {
    return topic.length > 80 ? topic.slice(0, 77) + "…" : topic;
  }

  private topicToFilename(topic: string): string {
    return topic
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "_")
      .toLowerCase()
      .slice(0, 80);
  }
}
