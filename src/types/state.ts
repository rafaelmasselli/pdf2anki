export interface QACard {
  front: string;
  back: string;
}

export interface ClozeCard {
  text: string;
}

export interface StudyContext {
  language: string;
  level: string;
  goal: string;
  additionalNotes: string;
}

export interface DocumentSummary {
  language: string;
  topic: string;
  keyConcepts: string;
  summary: string;
}

export interface GraphState {
  pdfPath: string;
  deckName: string;
  studyContext: StudyContext;
  documentSummary: DocumentSummary;
  chunks: string[];
  totalPages: number;
  qaCards: QACard[];
  clozeCards: ClozeCard[];
  outputPath: string;
  error?: string;
}
