const UNSPLASH_KEY = process.env.UNSPLASH_ACCESS_KEY!;
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "";

const PLACEHOLDER_IMAGES: Record<string, string> = {
  STEM: `${BASE_URL}/placeholders/stem.jpg`,
  GEOPOLITICAL: `${BASE_URL}/placeholders/geo.jpg`,
  SPORTS: `${BASE_URL}/placeholders/sports.jpg`,
  HUMANS_OF_BD: `${BASE_URL}/placeholders/humans.jpg`,
};

async function validateImageUrl(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, { method: "HEAD", signal: AbortSignal.timeout(5000) });
    const contentType = res.headers.get("content-type") || "";
    return res.ok && contentType.startsWith("image/");
  } catch {
    return false;
  }
}

async function fetchUnsplashImage(query: string): Promise<string | null> {
  if (!UNSPLASH_KEY) return null;
  try {
    const params = new URLSearchParams({
      query,
      per_page: "1",
      orientation: "squarish",
      client_id: UNSPLASH_KEY,
    });
    const res = await fetch(`https://api.unsplash.com/search/photos?${params}`);
    if (!res.ok) return null;
    const data = await res.json();
    const photo = data.results?.[0];
    return photo?.urls?.regular || null;
  } catch {
    return null;
  }
}

export async function resolveImage(
  thumbnailUrl: string | undefined,
  imageQuery: string,
  category: string
): Promise<{ url: string; tier: "primary" | "unsplash" | "placeholder" }> {
  // Tier 1: SerpAPI thumbnail
  if (thumbnailUrl) {
    const valid = await validateImageUrl(thumbnailUrl);
    if (valid) return { url: thumbnailUrl, tier: "primary" };
  }

  // Tier 2: Unsplash
  if (imageQuery) {
    const unsplashUrl = await fetchUnsplashImage(imageQuery);
    if (unsplashUrl) return { url: unsplashUrl, tier: "unsplash" };
  }

  // Tier 3: Static placeholder
  const placeholder = PLACEHOLDER_IMAGES[category] || PLACEHOLDER_IMAGES.STEM;
  return { url: placeholder, tier: "placeholder" };
}
