import { buildCardHtml } from "./template";

const HCTI_USER_ID = process.env.HCTI_USER_ID!;
const HCTI_API_KEY = process.env.HCTI_API_KEY!;
const HCTI_API_URL = "https://hcti.io/v1/image";

interface HCTIInput {
  category: string;
  headlineLine1: string;
  highlightedWord: string;
  headlineLine2: string;
  subcategory: string;
  sourceDomain: string;
  imageUrl?: string;
}

export async function generateCardImage(input: HCTIInput): Promise<string | null> {
  const html = buildCardHtml(input);

  const credentials = Buffer.from(`${HCTI_USER_ID}:${HCTI_API_KEY}`).toString("base64");

  try {
    const res = await fetch(HCTI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${credentials}`,
      },
      body: JSON.stringify({ html, css: "" }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error(`HCTI API error: ${res.status} - ${errText}`);
      return null;
    }

    const data = await res.json();
    return data.url || null;
  } catch (err) {
    console.error("HCTI generation error:", err);
    return null;
  }
}
