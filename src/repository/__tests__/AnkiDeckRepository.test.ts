import { describe, it, expect, afterEach } from "vitest";
import { AnkiDeckRepository } from "../AnkiDeckRepository.js";

describe("AnkiDeckRepository", () => {
  let repo: AnkiDeckRepository;

  afterEach(() => {
    repo.close();
  });

  it("inserts a QA card and persists it in the notes table", () => {
    repo = new AnkiDeckRepository("Test Deck");
    repo.insertQACard({ front: "What is TypeScript?", back: "A typed superset of JavaScript." });

    const note = repo["connection"].db
      .prepare("SELECT flds FROM notes")
      .get() as { flds: string };

    expect(note.flds).toContain("What is TypeScript?");
    expect(note.flds).toContain("A typed superset of JavaScript.");
  });

  it("inserts a Cloze card and persists it in the notes table", () => {
    repo = new AnkiDeckRepository("Test Deck");
    repo.insertClozeCard({ text: "TypeScript is a {{c1::typed}} superset of JavaScript." });

    const note = repo["connection"].db
      .prepare("SELECT flds FROM notes")
      .get() as { flds: string };

    expect(note.flds).toContain("TypeScript is a {{c1::typed}} superset of JavaScript.");
  });

  it("creates one card row per inserted note", () => {
    repo = new AnkiDeckRepository("Test Deck");
    repo.insertQACard({ front: "Q1", back: "A1" });
    repo.insertQACard({ front: "Q2", back: "A2" });
    repo.insertClozeCard({ text: "Cloze {{c1::one}}" });

    const count = (repo["connection"].db
      .prepare("SELECT COUNT(*) as count FROM cards")
      .get() as { count: number }).count;

    expect(count).toBe(3);
  });

  it("stores tags on the note", () => {
    repo = new AnkiDeckRepository("Test Deck");
    repo.insertQACard({ front: "Q", back: "A" }, ["qa", "important"]);

    const note = repo["connection"].db
      .prepare("SELECT tags FROM notes")
      .get() as { tags: string };

    expect(note.tags).toBe("qa important");
  });

  it("serializes to a valid SQLite Buffer (no WASM memory limit)", () => {
    repo = new AnkiDeckRepository("Large Deck");

    for (let i = 0; i < 3000; i++) {
      repo.insertQACard({ front: `Question ${i}`, back: `Answer ${i}` });
    }

    const buffer = repo.serialize();
    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(0);
  });

  it("initializes the col table with one row", () => {
    repo = new AnkiDeckRepository("Test Deck");

    const count = (repo["connection"].db
      .prepare("SELECT COUNT(*) as count FROM col")
      .get() as { count: number }).count;

    expect(count).toBe(1);
  });
});
