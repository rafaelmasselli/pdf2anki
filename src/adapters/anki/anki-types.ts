export interface AnkiField {
  name: string;
  ord: number;
  sticky: boolean;
  rtl: boolean;
  font: string;
  size: number;
}

export interface AnkiTemplate {
  name: string;
  ord: number;
  qfmt: string;
  afmt: string;
  did: null;
  bqfmt: string;
  bafmt: string;
}

export interface AnkiModel {
  id: number;
  name: string;
  type: number;
  mod: number;
  usn: number;
  sortf: number;
  did: number;
  tmpls: AnkiTemplate[];
  flds: AnkiField[];
  css: string;
  latexPre: string;
  latexPost: string;
  vers: unknown[];
  tags: string[];
}

export interface AnkiDeck {
  id: number;
  name: string;
  desc: string;
  mod: number;
  usn: number;
  collapsed: boolean;
  newToday: [number, number];
  revToday: [number, number];
  lrnToday: [number, number];
  timeToday: [number, number];
  dyn: number;
  extendNew: number;
  extendRev: number;
  conf: number;
}

export interface AnkiDeckConf {
  id: number;
  name: string;
  replayq: boolean;
  lapse: {
    leechFails: number;
    minInt: number;
    delays: number[];
    leechAction: number;
    mult: number;
  };
  rev: {
    perDay: number;
    ease4: number;
    ivlFct: number;
    maxIvl: number;
    minSpace: number;
    fuzz: number;
    hardFactor: number;
  };
  timer: number;
  maxTaken: number;
  usn: number;
  new: {
    perDay: number;
    delays: number[];
    separate: boolean;
    ints: number[];
    initialFactor: number;
    bury: boolean;
    order: number;
  };
  mod: number;
  autoplay: boolean;
}

export interface AnkiCollectionConf {
  nextPos: number;
  estTimes: boolean;
  activeDecks: number[];
  sortType: string;
  timeLim: number;
  sortBackwards: boolean;
  addToCur: boolean;
  curDeck: number;
  newBury: boolean;
  newSpread: number;
  dueCounts: boolean;
  curModel: number;
  collapseTime: number;
}
