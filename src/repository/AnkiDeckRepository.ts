import { randomInt, randomUUID } from "crypto";
import type { Statement } from "better-sqlite3";
import { AnkiDatabase } from "../infra/db/index.js";
import {
  AnkiModelAdapter,
  AnkiClozeModelAdapter,
  AnkiDeckAdapter,
  AnkiDeckConfAdapter,
  AnkiCollectionConfAdapter,
} from "../adapters/anki/index.js";
import type { QACard, ClozeCard } from "../shared/models/index.js";

export class AnkiDeckRepository {
  private readonly connection: AnkiDatabase;
  private readonly deckId: number;
  private readonly basicModelId: number;
  private readonly clozeModelId: number;
  private readonly insertNoteStmt: Statement;
  private readonly insertCardStmt: Statement;

  constructor(deckName: string) {
    this.connection = new AnkiDatabase();
    this.deckId = this.generateId();
    this.basicModelId = this.generateId();
    this.clozeModelId = this.generateId();
    this.insertCollection(deckName);

    this.insertNoteStmt = this.connection.db.prepare(
      `INSERT INTO notes (id, guid, mid, mod, usn, tags, flds, sfld, csum, flags, data)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, '')`,
    );

    this.insertCardStmt = this.connection.db.prepare(
      `INSERT INTO cards (id, nid, did, ord, mod, usn, type, queue, due, ivl, factor, reps, lapses, left, odue, odid, flags, data)
       VALUES (?, ?, ?, 0, ?, -1, 0, 0, ?, 0, 0, 0, 0, 0, 0, 0, 0, '')`,
    );
  }

  insertQACard(card: QACard, tags: string[] = []): void {
    const hint = card.hint ?? "";
    this.insertNote(
      this.basicModelId,
      `${card.front}\x1f${card.back}\x1f${hint}`,
      card.front,
      tags,
    );
  }

  insertClozeCard(card: ClozeCard, tags: string[] = []): void {
    this.insertNote(this.clozeModelId, `${card.text}\x1f`, card.text, tags);
  }

  serialize(): Buffer {
    return this.connection.serialize();
  }

  close(): void {
    this.connection.close();
  }

  /**
   * Executes a raw SELECT query and returns all matching rows.
   * Intended for use in tests only — avoids exposing the internal DB connection.
   */
  query<T = Record<string, unknown>>(sql: string): T[] {
    return this.connection.db.prepare(sql).all() as T[];
  }

  private insertCollection(deckName: string): void {
    const now = Math.floor(Date.now() / 1000);

    const basicModel = new AnkiModelAdapter(this.basicModelId, this.deckId).adapt();
    const clozeModel = new AnkiClozeModelAdapter(this.clozeModelId, this.deckId).adapt();
    const deck = new AnkiDeckAdapter(this.deckId, deckName).adapt();
    const deckConf = new AnkiDeckConfAdapter().adapt();
    const collectionConf = new AnkiCollectionConfAdapter(this.deckId, this.basicModelId).adapt();

    this.connection.db
      .prepare(
        `INSERT INTO col (id, crt, mod, scm, ver, dty, usn, ls, conf, models, decks, dconf, tags)
         VALUES (1, ?, ?, ?, 11, 0, -1, 0, ?, ?, ?, ?, '{}')`,
      )
      .run(
        now,
        now,
        now * 1000,
        JSON.stringify(collectionConf),
        JSON.stringify({ [this.basicModelId]: basicModel, [this.clozeModelId]: clozeModel }),
        JSON.stringify({ [this.deckId]: deck }),
        JSON.stringify({ 1: deckConf }),
      );
  }

  private insertNote(modelId: number, flds: string, sfld: string, tags: string[]): void {
    const now = Math.floor(Date.now() / 1000);
    const noteId = this.generateId();
    const cardId = this.generateId();

    this.insertNoteStmt.run(
      noteId,
      this.guid(),
      modelId,
      now,
      -1,
      tags.join(" "),
      flds,
      sfld,
      this.fieldChecksum(sfld),
    );

    this.insertCardStmt.run(cardId, noteId, this.deckId, now, noteId);
  }

  private generateId(): number {
    return Date.now() * 1000 + randomInt(1000);
  }

  private guid(): string {
    return randomUUID().replace(/-/g, "").slice(0, 10);
  }

  private fieldChecksum(text: string): number {
    const sample = text.slice(0, 9);
    let hash = 0;
    for (const char of sample) {
      hash = (Math.imul(hash, 31) - hash + char.charCodeAt(0)) | 0;
    }
    return hash >>> 0;
  }
}
