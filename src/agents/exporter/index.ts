import { createRequire } from "module";
import { writeFileSync, mkdirSync } from "fs";
import { dirname } from "path";
import type { GraphState } from "../../types/state.js";

// anki-apkg-export is a CommonJS module
const require = createRequire(import.meta.url);
const AnkiExport = require("anki-apkg-export").default;

export async function exporterAgent(
  state: GraphState,
): Promise<Partial<GraphState>> {
  const { qaCards, clozeCards, deckName, outputPath } = state;

  console.log(`\n[ExporterAgent] Building Anki deck: "${deckName}"`);
  console.log(
    `[ExporterAgent] Q&A cards: ${qaCards.length} | Cloze cards: ${clozeCards.length}`,
  );

  const apkg = AnkiExport(deckName);

  for (const card of qaCards) {
    apkg.addCard(card.front, card.back, { tags: ["qa"] });
  }

  for (const card of clozeCards) {
    apkg.addCard(card.text, card.text, { tags: ["cloze"] });
  }

  const zip = await apkg.save();

  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, zip, "binary");

  console.log(`[ExporterAgent] Deck saved to: ${outputPath}`);

  return { outputPath };
}
