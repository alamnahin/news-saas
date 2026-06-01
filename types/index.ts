export type Category = "STEM" | "GEOPOLITICAL" | "SPORTS" | "HUMANS_OF_BD" | "IRRELEVANT";

export interface SerpApiArticle {
  title: string;
  link: string;
  snippet: string;
  source: string;
  thumbnail?: string;
  date?: string;
}

export interface ClassificationResult {
  category: Category;
  confidence: number;
}

export interface ContentResult {
  headlineLine1: string;
  highlightedWord: string;
  headlineLine2: string;
  subcategory: string;
  summary: string;
  hashtags: string[];
  imageQuery: string;
}

export interface WorkflowResult {
  processed: number;
  published: number;
  failed: number;
  skipped: number;
  quotaReached: string[];
}

export const CATEGORY_QUOTAS: Record<string, number> = {
  STEM: 15,
  GEOPOLITICAL: 5,
  SPORTS: 7,
  HUMANS_OF_BD: 3,
};

export const CATEGORY_COLORS: Record<string, string> = {
  STEM: "#00C9A7",
  GEOPOLITICAL: "#FF6B6B",
  SPORTS: "#F9C74F",
  HUMANS_OF_BD: "#A78BFA",
};

export const CATEGORY_LABELS: Record<string, string> = {
  STEM: "বিজ্ঞান ও প্রযুক্তি",
  GEOPOLITICAL: "ভূরাজনীতি",
  SPORTS: "খেলাধুলা",
  HUMANS_OF_BD: "মানুষের গল্প",
};
