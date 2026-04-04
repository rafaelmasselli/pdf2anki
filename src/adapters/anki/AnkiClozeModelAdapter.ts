import type { AnkiModel } from "./anki-types.js";

export class AnkiClozeModelAdapter {
  constructor(
    private readonly modelId: number,
    private readonly deckId: number,
  ) {}

  adapt(): AnkiModel {
    return {
      id: this.modelId,
      name: "Cloze",
      type: 1,
      mod: this.nowSeconds(),
      usn: -1,
      sortf: 0,
      did: this.deckId,
      tmpls: [
        {
          name: "Cloze",
          ord: 0,
          qfmt: "{{cloze:Text}}",
          afmt: "{{cloze:Text}}<br><br>{{Extra}}",
          did: null,
          bqfmt: "",
          bafmt: "",
        },
      ],
      flds: [
        { name: "Text", ord: 0, sticky: false, rtl: false, font: "Arial", size: 20 },
        { name: "Extra", ord: 1, sticky: false, rtl: false, font: "Arial", size: 20 },
      ],
      css: ".card { font-family: arial; font-size: 20px; text-align: left; color: black; background-color: white; } .cloze { font-weight: bold; color: blue; }",
      latexPre:
        "\\documentclass[12pt]{article}\n\\special{papersize=3in,5in}\n\\usepackage[utf8]{inputenc}\n\\usepackage{amssymb,amsmath}\n\\pagestyle{empty}\n\\setlength{\\parindent}{0in}\n\\begin{document}\n",
      latexPost: "\\end{document}",
      vers: [],
      tags: [],
    };
  }

  private nowSeconds(): number {
    return Math.floor(Date.now() / 1000);
  }
}
