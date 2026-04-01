import { describe, it, expect } from "vitest";
import { tmpdir } from "os";
import { join } from "path";
import { existsSync, unlinkSync } from "fs";
import { AnkiDeckService } from "../AnkiDeckService.js";
import type { QACard, ClozeCard } from "../../shared/models/index.js";

const OUTPUT = join(tmpdir(), "test-deck.apkg");

function makeQACards(n: number): QACard[] {
  return Array.from({ length: n }, (_, i) => ({
    front: `Question ${i}`,
    back: `Answer ${i}`,
  }));
}

function makeClozeCards(n: number): ClozeCard[] {
  return Array.from({ length: n }, (_, i) => ({
    text: `The answer is {{c1::${i}}}.`,
  }));
}

describe("AnkiDeckService", () => {
  it("saves a single .apkg file for a small deck", async () => {
    const service = new AnkiDeckService();

    const result = await service.save({
      deckName: "Small Deck",
      outputPath: OUTPUT,
      qaCards: makeQACards(10),
      clozeCards: makeClozeCards(5),
    });

    expect(result.savedPaths).toHaveLength(1);
    expect(existsSync(result.savedPaths[0])).toBe(true);
    unlinkSync(result.savedPaths[0]);
  });

  it("splits into multiple files when cards exceed MAX_CARDS_PER_FILE", async () => {
    const service = new AnkiDeckService();

    const result = await service.save({
      deckName: "Large Deck",
      outputPath: OUTPUT,
      qaCards: makeQACards(300),
      clozeCards: makeClozeCards(300),
    });

    expect(result.savedPaths.length).toBeGreaterThan(1);

    for (const path of result.savedPaths) {
      expect(existsSync(path)).toBe(true);
      unlinkSync(path);
    }
  }, 30_000);

  it("handles 1000+ cards without memory errors (no WASM limit)", async () => {
    const service = new AnkiDeckService();

    const result = await service.save({
      deckName: "Stress Test",
      outputPath: OUTPUT,
      qaCards: makeQACards(600),
      clozeCards: makeClozeCards(600),
    });

    expect(result.savedPaths.length).toBeGreaterThan(0);

    for (const path of result.savedPaths) {
      if (existsSync(path)) unlinkSync(path);
    }
  }, 60_000);

  it("returns a savedPaths with .apkg extension", async () => {
    const service = new AnkiDeckService();

    const result = await service.save({
      deckName: "My Deck",
      outputPath: OUTPUT,
      qaCards: makeQACards(5),
      clozeCards: [],
    });

    for (const path of result.savedPaths) {
      expect(path.endsWith(".apkg")).toBe(true);
      if (existsSync(path)) unlinkSync(path);
    }
  });
});
