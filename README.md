# pdf2anki

A multi-agent pipeline that reads a PDF and generates an Anki deck (`.apkg`) with Q&A and Cloze flashcards, powered by [LangChain](https://js.langchain.com/), [LangGraph](https://langchain-ai.github.io/langgraphjs/), and Google Gemini via Vertex AI.

---

## How it works

> ```mermaid
> flowchart TD
>     PDF([PDF File]) --> Config
>
>     subgraph pipeline [LangGraph Pipeline]
>         Config["ConfigAgent\nCollects study context\n(language, level, goal, card mode)"]
>         Extractor["ExtractorAgent\nLoads PDF and splits into chunks\n(skips cover/preface pages)"]
>         Analyzer["AnalyzerAgent\nAnalyzes full document\n(language, topic, key concepts, modules)"]
>         QA["QAAgent\nGenerates Q&A cards\n(SuperMemo rules, 5 question types, hints)"]
>         Cloze["ClozeAgent\nGenerates Cloze cards\n({{c1::word}} syntax)"]
>         Exporter["ExporterAgent\nBuilds .apkg files\n(named by document modules)"]
>     end
>
>     Config --> Extractor
>     Extractor --> Analyzer
>     Analyzer --> QA & Cloze
>     QA & Cloze --> Exporter
>     Exporter --> APKG([output/*.apkg])
> ```

LangGraph orchestrates the pipeline as a state graph. The `AnalyzerAgent` reads the entire document before card generation, giving `QAAgent` and `ClozeAgent` full context — even when processing individual chunks. `QAAgent` and `ClozeAgent` run in parallel. Output files are named after the document's thematic modules extracted by the `AnalyzerAgent`.

---

## Architecture

The project follows Clean Architecture, OOP, and SOLID principles. Layers are strictly separated: `core` (agents + pipeline), `infra` (LLM + database), `adapters` (Anki data structures), `repository` (SQL queries), `services` (orchestration), and `shared` (domain models + DTOs).

```
src/
├── index.ts                          # Entry point — class CLI
├── core/
│   ├── agents/
│   │   ├── config/
│   │   │   └── index.ts              # class ConfigAgent
│   │   ├── extractor/
│   │   │   └── index.ts              # class ExtractorAgent
│   │   ├── analyzer/
│   │   │   ├── index.ts              # class AnalyzerAgent
│   │   │   ├── prompt.ts             # Document analysis prompt
│   │   │   └── schema.ts             # Zod output schema
│   │   ├── qa/
│   │   │   ├── index.ts              # class QAAgent
│   │   │   ├── prompt.ts             # Q&A generation prompt (SuperMemo rules)
│   │   │   └── schema.ts             # Zod output schema (with optional hint)
│   │   ├── cloze/
│   │   │   ├── index.ts              # class ClozeAgent
│   │   │   ├── prompt.ts             # Cloze generation prompt
│   │   │   └── schema.ts             # Zod output schema
│   │   └── exporter/
│   │       └── index.ts              # class ExporterAgent
│   └── pipeline/
│       ├── Pipeline.ts               # class Pipeline (LangGraph state graph)
│       └── index.ts
├── infra/
│   ├── db/
│   │   ├── AnkiDatabase.ts           # class AnkiDatabase (better-sqlite3 connection)
│   │   └── index.ts
│   └── llm/
│       ├── GeminiProvider.ts         # class GeminiProvider (Vertex AI)
│       └── index.ts
├── adapters/
│   └── anki/
│       ├── AnkiModelAdapter.ts       # Basic model (Q&A with Hint field)
│       ├── AnkiClozeModelAdapter.ts  # Cloze model (type: 1)
│       ├── AnkiDeckAdapter.ts        # Deck JSON structure
│       ├── AnkiDeckConfAdapter.ts    # Deck config JSON structure
│       ├── AnkiCollectionConfAdapter.ts
│       ├── anki-types.ts             # Anki internal type definitions
│       └── index.ts
├── repository/
│   ├── AnkiDeckRepository.ts         # class AnkiDeckRepository (SQL queries)
│   └── index.ts
├── services/
│   ├── AnkiDeckService.ts            # class AnkiDeckService (.apkg orchestration)
│   └── index.ts
└── shared/
    └── models/
        ├── domain.ts                 # Domain types (QACard, ClozeCard, StudyContext, CardMode…)
        ├── dto.ts                    # Data Transfer Objects (SaveDeckDTO…)
        ├── state.ts                  # LangGraph GraphState
        └── index.ts
```

---

## Requirements

- Node.js 22 (see `.nvmrc`)
- Google Cloud Vertex AI service account with Gemini access

---

## Setup

**1. Use the correct Node.js version**

```bash
nvm use
```

**2. Install dependencies**

```bash
npm install
```

**3. Configure environment variables**

```bash
cp .env.example .env
```

Edit `.env`:

```env
GOOGLE_VERTEX_PROJECT=your-gcp-project-id
GOOGLE_VERTEX_LOCATION=us-central1
GOOGLE_APPLICATION_CREDENTIALS=./ia-credentials.json
```

Place your service account JSON file at `ia-credentials.json` in the project root (it is git-ignored).

**4. Run**

```bash
npm start -- ./path/to/file.pdf "Deck Name"
```

The deck name is optional — if omitted, the PDF filename is used.

You will be prompted to select the study mode and card type before processing begins.

**5. Import into Anki**

Open Anki → `File` → `Import` → select the `.apkg` file(s) from the `output/` folder.

---

## Input folder

Place PDF files you want to process in the `input/` folder. This folder is git-ignored (only `.gitkeep` is tracked) so your documents stay local.

```bash
cp my-document.pdf input/
npm start -- ./input/my-document.pdf
```

---

## Study modes

| Mode                 | Description                                                           |
| -------------------- | --------------------------------------------------------------------- |
| **English learning** | Front in English, back in Portuguese with translation and explanation |
| **University**       | Portuguese cards with comprehensive summaries, no information lost    |
| **Custom**           | Configure language, level, goal, and extra instructions manually      |

---

## Card types

| Type      | Description                                                                                | Example                                                 |
| --------- | ------------------------------------------------------------------------------------------ | ------------------------------------------------------- |
| **Q&A**   | Front/back flashcard following SuperMemo rules. Supports an optional hint field.           | Front: "In Git, what does a rebase do?" → Back: "It…"   |
| **Cloze** | Fill-in-the-blank using Anki's native `{{c1::word}}` syntax, rendered with the Cloze model | `"Git uses {{c1::branches}} for parallel development."` |

### Card mode

At startup you can choose which card types to generate:

| Option       | Description                            |
| ------------ | -------------------------------------- |
| `both`       | Generate Q&A and Cloze cards (default) |
| `qa-only`    | Generate Q&A cards only                |
| `cloze-only` | Generate Cloze cards only              |

---

## Q&A prompt — SuperMemo rules

The `QAAgent` follows [SuperMemo's 20 rules](https://www.supermemo.com/en/blog/twenty-rules-of-formulating-knowledge) for flashcard formulation:

- **Minimum information principle** — one fact per card
- **Five question types** — Definition, Mechanism, Comparison, Cause/effect, Application
- **Context in the question** — always names the domain; never asks a generic question
- **Answer quality** — 1–2 sentences, no bullet points, no filler phrases
- **Optional hint** — guides the student without revealing the answer
- **Forbidden patterns** — no yes/no questions, no trivial author/title questions

---

## Output

Each run produces one or more `.apkg` files in `output/`, named after the document's thematic modules (e.g. `Version Control with Git.apkg`, `SOLID Principles.apkg`). If no modules are detected, files fall back to `_part1.apkg`, `_part2.apkg`, etc.

---

## Development

```bash
npm run build          # TypeScript type check
npm run lint           # ESLint
npm run format         # Prettier (write)
npm run format:check   # Prettier (check only)
npm test               # Vitest
```

Tests are co-located with source files under `__tests__/` directories.

---

## Stack

| Layer         | Technology                            |
| ------------- | ------------------------------------- |
| Runtime       | Node.js 22 + TypeScript               |
| LLM           | Google Gemini via Vertex AI           |
| Agents        | LangChain.js                          |
| Orchestration | LangGraph.js                          |
| PDF parsing   | `@langchain/community` + `pdf-parse`  |
| Database      | `better-sqlite3` (disk-based SQLite)  |
| Deck export   | `jszip` (`.apkg` = SQLite + zip)      |
| Validation    | Zod                                   |
| CLI prompts   | `prompts`                             |
| Testing       | Vitest                                |
| Linting       | ESLint + Prettier                     |
| CI            | GitHub Actions (Node 22 via `.nvmrc`) |

---

## License

MIT
