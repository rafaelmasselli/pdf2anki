import type { AnkiCollectionConf } from "./anki-types.js";

export class AnkiCollectionConfAdapter {
  constructor(
    private readonly deckId: number,
    private readonly modelId: number,
  ) {}

  adapt(): AnkiCollectionConf {
    return {
      nextPos: 1,
      estTimes: true,
      activeDecks: [this.deckId],
      sortType: "noteFld",
      timeLim: 0,
      sortBackwards: false,
      addToCur: true,
      curDeck: this.deckId,
      newBury: true,
      newSpread: 0,
      dueCounts: true,
      curModel: this.modelId,
      collapseTime: 1200,
    };
  }
}
