import { createRequire } from "module";
import { writeFileSync, mkdirSync } from "fs";
import { dirname } from "path";
import type { IAgent } from "../../types/interfaces.js";
import type { GraphState, QACard, ClozeCard } from "../../types/state.js";

// anki-apkg-export is a CommonJS module
const require = createRequire(import.meta.url);
const AnkiExport = require("anki-apkg-export").default;

export class ExporterAgent implements IAgent {
  async run(state: GraphState): Promise<Partial<GraphState>> {
    const { qaCards, clozeCards, deckName, outputPath } = state;

    console.log(`\n[ExporterAgent] Building Anki deck: "${deckName}"`);
    console.log(
      `[ExporterAgent] Q&A cards: ${qaCards.length} | Cloze cards: ${clozeCards.length}`,
    );

    const apkg = this.createDeck(deckName);
    this.addQACards(apkg, qaCards);
    this.addClozeCards(apkg, clozeCards);

    const zip = await apkg.save();
    this.saveFile(outputPath, zip);

    console.log(`[ExporterAgent] Deck saved to: ${outputPath}`);
    return { outputPath };
  }

  private createDeck(deckName: string) {
    return AnkiExport(deckName);
  }

  private addQACards(apkg: ReturnType<typeof AnkiExport>, cards: QACard[]) {
    for (const card of cards) {
      apkg.addCard(card.front, card.back, { tags: ["qa"] });
    }
  }

  private addClozeCards(
    apkg: ReturnType<typeof AnkiExport>,
    cards: ClozeCard[],
  ) {
    for (const card of cards) {
      apkg.addCard(card.text, card.text, { tags: ["cloze"] });
    }
  }

  private saveFile(outputPath: string, zip: Buffer) {
    mkdirSync(dirname(outputPath), { recursive: true });
    writeFileSync(outputPath, zip, "binary");
  }
}
