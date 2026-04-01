import type { IAgent, IAnkiDeckService } from "../../ports/index.js";
import type { GraphState, SaveDeckDTO } from "../../../shared/models/index.js";
import { AnkiDeckService } from "../../../services/index.js";

export class ExporterAgent implements IAgent {
  private readonly deckService: IAnkiDeckService;

  constructor(deckService: IAnkiDeckService = new AnkiDeckService()) {
    this.deckService = deckService;
  }

  async run(state: GraphState): Promise<Partial<GraphState>> {
    const { qaCards, clozeCards, deckName, outputPath } = state;

    console.log(`\n[ExporterAgent] Building Anki deck: "${deckName}"`);
    console.log(
      `[ExporterAgent] Q&A cards: ${qaCards.length} | Cloze cards: ${clozeCards.length} | Total: ${qaCards.length + clozeCards.length}`,
    );

    const dto: SaveDeckDTO = { deckName, outputPath, qaCards, clozeCards };
    const { savedPaths } = await this.deckService.save(dto);

    for (const path of savedPaths) {
      console.log(`[ExporterAgent] Saved: ${path}`);
    }

    return { outputPath: savedPaths[0] };
  }
}
