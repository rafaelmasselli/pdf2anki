# pdf2anki

A multi-agent pipeline that reads a PDF and generates an Anki deck (`.apkg`) with Q&A and Cloze flashcards, powered by [LangChain](https://js.langchain.com/), [LangGraph](https://langchain-ai.github.io/langgraphjs/), and Google Gemini.

---

## How it works

```
PDF File
   │
   ▼
[ExtractorAgent]        Loads the PDF and splits it into text chunks
   │
   ├─────────────────────────────┐
   ▼                             ▼
[QAAgent]                  [ClozeAgent]
Generates Q&A cards        Generates Cloze cards
        │                             │
        └──────────┬──────────────────┘
                   ▼
          [ExporterAgent]
          Builds the .apkg file
                   │
                   ▼
          output/deck.apkg
```

LangGraph orchestrates the pipeline as a state graph. After extraction, `QAAgent` and `ClozeAgent` run in parallel before the deck is exported.

---

## Requirements

- Node.js >= 20
- A [Google AI Studio API key](https://aistudio.google.com/app/apikey)

---

## Setup

**1. Install dependencies**

```bash
npm install
```

**2. Configure environment variables**

```bash
cp .env.example .env
```

Edit `.env` and fill in your key:

```env
GOOGLE_API_KEY=your_key_here
```

**3. Run**

```bash
npm start -- ./path/to/file.pdf "Deck Name"
```

The deck name is optional — if omitted, the PDF filename is used as the deck name.

**4. Import into Anki**

Open Anki → `File` → `Import` → select the `.apkg` file generated in the `output/` folder.

---

## Card types

| Type      | Description                                          | Example                                     |
| --------- | ---------------------------------------------------- | ------------------------------------------- |
| **Q&A**   | Classic front/back flashcard                         | Front: "What is X?" → Back: "X is..."       |
| **Cloze** | Fill-in-the-blank using Anki's `{{c1::word}}` syntax | `"The capital of France is {{c1::Paris}}."` |

---

## Project structure

```
src/
├── index.ts                    # CLI entry point
├── graph.ts                    # LangGraph pipeline definition
├── agents/
│   ├── index.ts                # Barrel exports
│   ├── extractor/
│   │   └── index.ts            # PDF loading and text splitting
│   ├── qa/
│   │   ├── index.ts            # Q&A card generation logic
│   │   ├── prompt.ts           # System and human prompts
│   │   └── schema.ts           # Zod output schema
│   ├── cloze/
│   │   ├── index.ts            # Cloze card generation logic
│   │   ├── prompt.ts           # System and human prompts
│   │   └── schema.ts           # Zod output schema
│   └── exporter/
│       └── index.ts            # .apkg file export
├── lib/
│   └── llm.ts                  # Gemini LLM instance
└── types/
    └── state.ts                # Shared pipeline state types
```

---

## Stack

| Layer         | Technology                           |
| ------------- | ------------------------------------ |
| Runtime       | Node.js + TypeScript                 |
| LLM           | Google Gemini (`gemini-2.0-flash`)   |
| Agents        | LangChain.js                         |
| Orchestration | LangGraph.js                         |
| PDF parsing   | `@langchain/community` + `pdf-parse` |
| Deck export   | `anki-apkg-export`                   |

---

## License

MIT
