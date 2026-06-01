import { SerpApiArticle } from "@/types";

const SERPAPI_KEY = process.env.SERPAPI_API_KEY!;
const BASE_URL = "https://serpapi.com/search";

const CATEGORY_QUERIES: Record<string, string> = {
  STEM: "বিজ্ঞান OR প্রযুক্তি OR গবেষণা",
  GEOPOLITICAL: "বিশ্ব রাজনীতি OR কূটনীতি OR সংঘর্ষ",
  SPORTS: "ক্রিকেট OR ফুটবল OR খেলাধুলা",
  HUMANS_OF_BD: "বাংলাদেশ ভালোবাসা OR মানবিক OR অনুপ্রেরণা",
};

async function fetchCategoryNews(category: string): Promise<SerpApiArticle[]> {
  const query = CATEGORY_QUERIES[category];
  if (!query) return [];

  const params = new URLSearchParams({
    engine: "google_news",
    q: query,
    hl: "bn",
    gl: "bd",
    num: "30",
    api_key: SERPAPI_KEY,
  });

  try {
    const res = await fetch(`${BASE_URL}?${params.toString()}`);
    if (!res.ok) {
      console.error(`SerpAPI error for ${category}: ${res.status}`);
      return [];
    }
    const data = await res.json();
    const results: SerpApiArticle[] = [];

    const newsResults = data.news_results || [];
    for (const item of newsResults) {
      results.push({
        title: item.title || "",
        link: item.link || item.url || "",
        snippet: item.snippet || item.description || "",
        source: item.source?.name || item.source || "অজানা সূত্র",
        thumbnail: item.thumbnail || item.image || undefined,
        date: item.date || undefined,
      });
    }
    return results;
  } catch (err) {
    console.error(`SerpAPI fetch error for ${category}:`, err);
    return [];
  }
}

export async function fetchAllNews(): Promise<SerpApiArticle[]> {
  const categories = ["STEM", "GEOPOLITICAL", "SPORTS", "HUMANS_OF_BD"];
  const allResults = await Promise.all(
    categories.map((cat) => fetchCategoryNews(cat))
  );

  // Merge and deduplicate by link
  const seen = new Set<string>();
  const merged: SerpApiArticle[] = [];
  for (const batch of allResults) {
    for (const article of batch) {
      if (article.link && !seen.has(article.link)) {
        seen.add(article.link);
        merged.push(article);
      }
    }
  }
  return merged;
}
