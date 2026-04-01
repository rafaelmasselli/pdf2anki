import { AnkiDatabase } from "../infra/db/index.js";
import {
  AnkiModelAdapter,
  AnkiDeckAdapter,
  AnkiDeckConfAdapter,
  AnkiCollectionConfAdapter,
} from "../adapters/anki/index.js";
import type { QACard, ClozeCard } from "../shared/models/index.js";

export class AnkiDeckRepository {
  private readonly connection: AnkiDatabase;
  private readonly deckId: number;
  private readonly modelId: number;
  private noteCount = 0;

  constructor(deckName: string) {
    this.connection = new AnkiDatabase();
    this.deckId = this.generateId();
    this.modelId = this.generateId();
    this.insertCollection(deckName);
  }

  insertQACard(card: QACard, tags: string[] = []): void {
    this.insertRaw(card.front, card.back, tags);
  }

  insertClozeCard(card: ClozeCard, tags: string[] = []): void {
    this.insertRaw(card.text, card.text, tags);
  }

  serialize(): Buffer {
    return this.connection.serialize();
  }

  close(): void {
    this.connection.close();
  }

  private insertCollection(deckName: string): void {
    const now = Math.floor(Date.now() / 1000);

    const model = new AnkiModelAdapter(this.modelId, this.deckId).adapt();
    const deck = new AnkiDeckAdapter(this.deckId, deckName).adapt();
    const deckConf = new AnkiDeckConfAdapter().adapt();
    const collectionConf = new AnkiCollectionConfAdapter(
      this.deckId,
      this.modelId,
    ).adapt();

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
        JSON.stringify({ [this.modelId]: model }),
        JSON.stringify({ [this.deckId]: deck }),
        JSON.stringify({ 1: deckConf }),
      );
  }

  private insertRaw(front: string, back: string, tags: string[]): void {
    const now = Math.floor(Date.now() / 1000);
    const noteId = this.generateId();
    const cardId = this.generateId();

    this.connection.db
      .prepare(
        `INSERT INTO notes (id, guid, mid, mod, usn, tags, flds, sfld, csum, flags, data)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, '')`,
      )
      .run(
        noteId,
        this.guid(),
        this.modelId,
        now,
        -1,
        tags.join(" "),
        `${front}\x1f${back}`,
        front,
        this.fieldChecksum(front),
      );

    this.connection.db
      .prepare(
        `INSERT INTO cards (id, nid, did, ord, mod, usn, type, queue, due, ivl, factor, reps, lapses, left, odue, odid, flags, data)
         VALUES (?, ?, ?, 0, ?, -1, 0, 0, ?, 0, 0, 0, 0, 0, 0, 0, 0, '')`,
      )
      .run(cardId, noteId, this.deckId, now, ++this.noteCount);
  }

  private readonly baseId = Date.now();
  private idCounter = 0;

  private generateId(): number {
    return this.baseId + ++this.idCounter;
  }

  private guid(): string {
    return Math.random().toString(36).slice(2, 12);
  }

  private fieldChecksum(text: string): number {
    let hash = 0;
    for (let i = 0; i < Math.min(text.length, 9); i++) {
      hash = (hash << 5) - hash + text.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash);
  }
}
