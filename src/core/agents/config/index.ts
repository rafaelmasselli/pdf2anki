import prompts from "prompts";
import type { IAgent } from "../../ports/index.js";
import type { GraphState, StudyContext } from "../../../shared/models/index.js";

type StudyMode = "english-learning" | "university" | "custom";

const PRESET_CONTEXTS: Record<Exclude<StudyMode, "custom">, StudyContext> = {
  "english-learning": {
    language: "Portuguese",
    level: "intermediate English learner",
    goal: "English vocabulary and comprehension",
    additionalNotes:
      "The front of each card must be in English (the word, phrase or sentence from the text). " +
      "The back must be in Portuguese with the translation and a brief explanation. " +
      "For cloze cards, write the sentence in English with the key word hidden, and add the Portuguese translation below.",
  },
  university: {
    language: "Portuguese",
    level: "undergraduate",
    goal: "exam preparation and concept retention",
    additionalNotes:
      "Write comprehensive cards covering all key concepts, definitions, and facts. " +
      "Do not omit any important information. Keep technical terms in their original language but explain them in Portuguese.",
  },
};

export class ConfigAgent implements IAgent {
  async run(_state: GraphState): Promise<Partial<GraphState>> {
    console.log("\n=== Study Context Setup ===\n");

    const { mode } = await prompts({
      type: "select",
      name: "mode",
      message: "What type of study is this?",
      choices: [
        {
          title: "English learning  —  English front, Portuguese back with translation",
          value: "english-learning",
        },
        {
          title: "University  —  Portuguese cards, full summary, no info lost",
          value: "university",
        },
        {
          title: "Custom  —  Configure manually",
          value: "custom",
        },
      ],
    });

    const studyContext: StudyContext =
      mode === "custom"
        ? await this.buildCustomContext()
        : PRESET_CONTEXTS[mode as Exclude<StudyMode, "custom">];

    console.log("\n[ConfigAgent] Study context configured:");
    console.log(`  Language : ${studyContext.language}`);
    console.log(`  Level    : ${studyContext.level}`);
    console.log(`  Goal     : ${studyContext.goal}`);

    return { studyContext };
  }

  private async buildCustomContext(): Promise<StudyContext> {
    const answers = await prompts([
      {
        type: "text",
        name: "language",
        message: "Language for the cards (e.g. Portuguese, English, same as PDF):",
        initial: "same as PDF",
      },
      {
        type: "select",
        name: "level",
        message: "Study level:",
        choices: [
          { title: "High school", value: "high school" },
          { title: "Undergraduate", value: "undergraduate" },
          { title: "Graduate / postgraduate", value: "graduate" },
          { title: "Professional", value: "professional" },
          { title: "Self-study", value: "self-study" },
        ],
      },
      {
        type: "select",
        name: "goal",
        message: "Study goal:",
        choices: [
          { title: "Exam preparation", value: "exam preparation" },
          { title: "General review", value: "general review" },
          { title: "Language learning", value: "language learning" },
          {
            title: "Memorize concepts and definitions",
            value: "memorize concepts and definitions",
          },
          {
            title: "Professional certification",
            value: "professional certification",
          },
        ],
      },
      {
        type: "text",
        name: "additionalNotes",
        message: "Any extra instructions for the AI? (optional):",
        initial: "none",
      },
    ]);

    return {
      language: answers.language,
      level: answers.level,
      goal: answers.goal,
      additionalNotes: answers.additionalNotes,
    };
  }
}
