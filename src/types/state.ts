export interface QACard {
  front: string;
  back: string;
}

export interface ClozeCard {
  text: string;
}

export interface GraphState {
  pdfPath: string;
  deckName: string;
  chunks: string[];
  totalPages: number;
  qaCards: QACard[];
  clozeCards: ClozeCard[];
  outputPath: string;
  error?: string;
}
