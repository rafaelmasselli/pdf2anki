import type { AnkiDeckConf } from "./anki-types.js";

export class AnkiDeckConfAdapter {
  adapt(): AnkiDeckConf {
    return {
      id: 1,
      name: "Default",
      replayq: true,
      lapse: {
        leechFails: 8,
        minInt: 1,
        delays: [10],
        leechAction: 0,
        mult: 0,
      },
      rev: {
        perDay: 200,
        ease4: 1.3,
        ivlFct: 1,
        maxIvl: 36500,
        minSpace: 1,
        fuzz: 0.05,
        hardFactor: 1.2,
      },
      timer: 0,
      maxTaken: 60,
      usn: -1,
      new: {
        perDay: 20,
        delays: [1, 10],
        separate: true,
        ints: [1, 4, 7],
        initialFactor: 2500,
        bury: true,
        order: 1,
      },
      mod: 0,
      autoplay: true,
    };
  }
}
