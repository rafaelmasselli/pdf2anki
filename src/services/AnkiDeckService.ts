import { writeFileSync, mkdirSync } from "fs";
import { dirname, extname, basename } from "path";
import JSZip from "jszip";
import { AnkiDeckRepository } from "../repository/AnkiDeckRepository.js";
import type { IAnkiDeckService } from "../core/ports/index.js";
import type { QACard, ClozeCard, SaveDeckDTO, SaveDeckResultDTO } from "../shared/models/index.js";

interface CardBatch {
  index: number;
  qaCards: QACard[];
  clozeCards: ClozeCard[];
}

export class AnkiDeckService implements IAnkiDeckService {
  private static readonly MAX_CARDS_PER_FILE = 500;

  async save(dto: SaveDeckDTO): Promise<SaveDeckResultDTO> {
    const { deckName, outputPath, qaCards, clozeCards } = dto;
    const batches = this.splitIntoBatches(qaCards, clozeCards);
    const savedPaths: string[] = [];

    for (const batch of batches) {
      const partName =
        batches.length > 1 ? `${deckName} (Part ${batch.index}/${batches.length})` : deckName;

      const partPath =
        batches.length > 1 ? this.buildPartPath(outputPath, batch.index) : outputPath;

      const buffer = await this.buildApkg(partName, batch.qaCards, batch.clozeCards);
      this.writeFile(partPath, buffer);
      savedPaths.push(partPath);
    }

    return { savedPaths };
  }

  private splitIntoBatches(qaCards: QACard[], clozeCards: ClozeCard[]): CardBatch[] {
    const all = [
      ...qaCards.map((card) => ({ type: "qa" as const, card })),
      ...clozeCards.map((card) => ({ type: "cloze" as const, card })),
    ];

    return this.chunk(all, AnkiDeckService.MAX_CARDS_PER_FILE).map((chunk, i) => ({
      index: i + 1,
      qaCards: chunk.filter((c) => c.type === "qa").map((c) => c.card as QACard),
      clozeCards: chunk.filter((c) => c.type === "cloze").map((c) => c.card as ClozeCard),
    }));
  }

  private chunk<T>(array: T[], size: number): T[][] {
    const result: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      result.push(array.slice(i, i + size));
    }
    return result;
  }

  private async buildApkg(
    deckName: string,
    qaCards: QACard[],
    clozeCards: ClozeCard[],
  ): Promise<Buffer> {
    const repo = new AnkiDeckRepository(deckName);

    for (const card of qaCards) repo.insertQACard(card, ["qa"]);
    for (const card of clozeCards) repo.insertClozeCard(card, ["cloze"]);

    const dbBuffer = repo.serialize();
    repo.close();

    return this.zip(dbBuffer);
  }

  private async zip(dbBuffer: Buffer): Promise<Buffer> {
    const archive = new JSZip();
    archive.file("collection.anki2", dbBuffer);
    archive.file("media", "{}");
    return archive.generateAsync({
      type: "nodebuffer",
      compression: "DEFLATE",
    });
  }

  private writeFile(filePath: string, buffer: Buffer): void {
    mkdirSync(dirname(filePath), { recursive: true });
    writeFileSync(filePath, buffer);
  }

  private buildPartPath(outputPath: string, index: number): string {
    const ext = extname(outputPath);
    const base = basename(outputPath, ext);
    const dir = dirname(outputPath);
    return `${dir}/${base}_part${index}${ext}`;
  }
}
