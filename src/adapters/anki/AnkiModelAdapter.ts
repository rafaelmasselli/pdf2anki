import type { AnkiModel } from "./anki-types.js";

export class AnkiModelAdapter {
  constructor(
    private readonly modelId: number,
    private readonly deckId: number,
  ) {}

  adapt(): AnkiModel {
    return {
      id: this.modelId,
      name: "Basic",
      type: 0,
      mod: this.nowSeconds(),
      usn: -1,
      sortf: 0,
      did: this.deckId,
      tmpls: [
        {
          name: "Card 1",
          ord: 0,
          qfmt: "{{Front}}",
          afmt: "{{FrontSide}}\n\n<hr id=answer>\n\n{{Back}}",
          did: null,
          bqfmt: "",
          bafmt: "",
        },
      ],
      flds: [
        { name: "Front", ord: 0, sticky: false, rtl: false, font: "Arial", size: 20 },
        { name: "Back",  ord: 1, sticky: false, rtl: false, font: "Arial", size: 20 },
      ],
      css: ".card { font-family: arial; font-size: 20px; text-align: center; color: black; background-color: white; }",
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
