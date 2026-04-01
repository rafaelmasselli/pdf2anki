import Database from "better-sqlite3";
import { tmpdir } from "os";
import { join } from "path";
import { readFileSync, unlinkSync, existsSync } from "fs";

export class AnkiDatabase {
  readonly db: Database.Database;
  readonly tmpPath: string;

  constructor() {
    this.tmpPath = join(tmpdir(), `anki-${Date.now()}-${Math.random().toString(36).slice(2)}.db`);
    this.db = new Database(this.tmpPath);
    this.createSchema();
  }

  serialize(): Buffer {
    this.db.close();
    return readFileSync(this.tmpPath);
  }

  close(): void {
    if (existsSync(this.tmpPath)) {
      try {
        unlinkSync(this.tmpPath);
      } catch {
        /* already removed */
      }
    }
  }

  private createSchema(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS col (
        id INTEGER PRIMARY KEY, crt INTEGER, mod INTEGER, scm INTEGER,
        ver INTEGER, dty INTEGER, usn INTEGER, ls INTEGER,
        conf TEXT, models TEXT, decks TEXT, dconf TEXT, tags TEXT
      );
      CREATE TABLE IF NOT EXISTS notes (
        id INTEGER PRIMARY KEY, guid TEXT, mid INTEGER, mod INTEGER,
        usn INTEGER, tags TEXT, flds TEXT, sfld TEXT, csum INTEGER,
        flags INTEGER, data TEXT
      );
      CREATE TABLE IF NOT EXISTS cards (
        id INTEGER PRIMARY KEY, nid INTEGER, did INTEGER, ord INTEGER,
        mod INTEGER, usn INTEGER, type INTEGER, queue INTEGER,
        due INTEGER, ivl INTEGER, factor INTEGER, reps INTEGER,
        lapses INTEGER, left INTEGER, odue INTEGER, odid INTEGER,
        flags INTEGER, data TEXT
      );
      CREATE TABLE IF NOT EXISTS revlog (
        id INTEGER PRIMARY KEY, cid INTEGER, usn INTEGER, ease INTEGER,
        ivl INTEGER, lastIvl INTEGER, factor INTEGER, time INTEGER, type INTEGER
      );
      CREATE TABLE IF NOT EXISTS graves (
        usn INTEGER, oid INTEGER, type INTEGER
      );
    `);
  }
}
