import type { AnkiDeck } from "./anki-types.js";

export class AnkiDeckAdapter {
  constructor(
    private readonly deckId: number,
    private readonly deckName: string,
  ) {}

  adapt(): AnkiDeck {
    return {
      id: this.deckId,
      name: this.deckName,
      desc: "",
      mod: Math.floor(Date.now() / 1000),
      usn: -1,
      collapsed: false,
      newToday: [0, 0],
      revToday: [0, 0],
      lrnToday: [0, 0],
      timeToday: [0, 0],
      dyn: 0,
      extendNew: 10,
      extendRev: 50,
      conf: 1,
    };
  }
}
