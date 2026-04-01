import { describe, it, expect, afterEach } from "vitest";
import { existsSync } from "fs";
import { AnkiDatabase } from "../AnkiDatabase.js";

describe("AnkiDatabase", () => {
  let db: AnkiDatabase;

  afterEach(() => {
    db.close();
  });

  it("creates a temporary file on disk", () => {
    db = new AnkiDatabase();
    expect(existsSync(db.tmpPath)).toBe(true);
  });

  it("creates all required Anki tables", () => {
    db = new AnkiDatabase();

    const tables = db.db
      .prepare("SELECT name FROM sqlite_master WHERE type='table'")
      .all()
      .map((r: unknown) => (r as { name: string }).name);

    expect(tables).toContain("col");
    expect(tables).toContain("notes");
    expect(tables).toContain("cards");
    expect(tables).toContain("revlog");
    expect(tables).toContain("graves");
  });

  it("serialize returns a non-empty Buffer", () => {
    db = new AnkiDatabase();
    const buffer = db.serialize();
    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(0);
  });

  it("close removes the temporary file", () => {
    db = new AnkiDatabase();
    const path = db.tmpPath;
    db.serialize();
    db.close();
    expect(existsSync(path)).toBe(false);
  });

  it("close is idempotent — no error on double call", () => {
    db = new AnkiDatabase();
    db.serialize();
    db.close();
    expect(() => db.close()).not.toThrow();
  });
});
