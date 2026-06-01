import { ChatOpenAI } from "@langchain/openai";
import { ClassificationResult, ContentResult } from "@/types";

const llm = new ChatOpenAI({
  modelName: "gpt-4o",
  temperature: 0.3,
  openAIApiKey: process.env.OPENAI_API_KEY,
});

export async function classifyArticle(
  title: string,
  snippet: string
): Promise<ClassificationResult> {
  const prompt = `You are a news classifier for a Bangla news platform.
Classify the following article into exactly one category: STEM | GEOPOLITICAL | SPORTS | HUMANS_OF_BD | IRRELEVANT.

Rules:
- STEM: Science, technology, engineering, mathematics, research, space, AI, medical breakthroughs
- GEOPOLITICAL: Global/regional politics, diplomacy, war, conflict, international relations
- SPORTS: Cricket, football, athletics, sports events, player news
- HUMANS_OF_BD: Positive, uplifting, inspiring human-interest stories specifically from Bangladesh
- IRRELEVANT: Anything else, crime-only stories, entertainment without educational value, ads

Return ONLY valid JSON: { "category": "...", "confidence": 0.0 }
Confidence below 0.75 should return IRRELEVANT.

Article Title: ${title}
Article Snippet: ${snippet}`;

  try {
    const response = await llm.invoke(prompt);
    const text = response.content as string;
    const clean = text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);
    return {
      category: parsed.category || "IRRELEVANT",
      confidence: parsed.confidence || 0,
    };
  } catch (err) {
    console.error("Classification error:", err);
    return { category: "IRRELEVANT", confidence: 0 };
  }
}

export async function generateContent(
  title: string,
  snippet: string,
  category: string
): Promise<ContentResult | null> {
  const categoryHint: Record<string, string> = {
    STEM: "science and technology",
    GEOPOLITICAL: "geopolitics and international affairs",
    SPORTS: "sports",
    HUMANS_OF_BD: "human interest stories from Bangladesh",
  };

  const prompt = `You are a professional Bangla news editor specializing in ${categoryHint[category] || "news"}.

Based on the article below, generate content in Bangla (Bengali script). Return ONLY valid JSON with no markdown, no extra text.

Required JSON format:
{
  "headlineLine1": "max 5 Bangla words",
  "highlightedWord": "ONE Bangla word to visually accent",
  "headlineLine2": "max 5 Bangla words",
  "subcategory": "2-3 word Bangla category tag",
  "summary": "2-3 sentence Bangla summary of the news",
  "hashtags": ["#বাংলা", "#হ্যাশট্যাগ"],
  "imageQuery": "short English keywords for stock photo search"
}

Article Title: ${title}
Article Snippet: ${snippet}
Category: ${category}

Important:
- All text fields MUST be in Bangla script except imageQuery
- headlineLine1 + highlightedWord + headlineLine2 together form the headline
- hashtags: 5-8 relevant Bangla hashtags
- imageQuery: 3-5 English words for an image search (e.g., "scientist laboratory research")`;

  try {
    const response = await llm.invoke(prompt);
    const text = response.content as string;
    const clean = text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);
    return parsed as ContentResult;
  } catch (err) {
    console.error("Content generation error:", err);
    return null;
  }
}
