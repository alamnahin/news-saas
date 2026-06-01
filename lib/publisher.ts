const FB_PAGE_ID = process.env.FB_PAGE_ID!;
const FB_PAGE_ACCESS_TOKEN = process.env.FB_PAGE_ACCESS_TOKEN!;
const IG_BUSINESS_ACCOUNT_ID = process.env.IG_BUSINESS_ACCOUNT_ID!;
const IG_ACCESS_TOKEN = process.env.IG_ACCESS_TOKEN!;

const GRAPH_API_BASE = "https://graph.facebook.com/v19.0";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function buildCaption(summary: string, hashtags: string[]): string {
  const hashtagText = hashtags.join("\n");
  return `${summary}\n\n${hashtagText}`;
}

export async function publishToFacebook(
  imageUrl: string,
  summary: string,
  hashtags: string[]
): Promise<string | null> {
  const caption = buildCaption(summary, hashtags);
  try {
    const res = await fetch(`${GRAPH_API_BASE}/${FB_PAGE_ID}/photos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: imageUrl,
        caption,
        access_token: FB_PAGE_ACCESS_TOKEN,
      }),
    });

    const data = await res.json();
    if (!res.ok || data.error) {
      console.error("Facebook publish error:", data.error || data);
      return null;
    }
    return data.id || data.post_id || null;
  } catch (err) {
    console.error("Facebook publish exception:", err);
    return null;
  }
}

export async function publishToInstagram(
  imageUrl: string,
  summary: string,
  hashtags: string[]
): Promise<string | null> {
  const caption = buildCaption(summary, hashtags);

  try {
    // Step 1: Create media container
    const containerRes = await fetch(
      `${GRAPH_API_BASE}/${IG_BUSINESS_ACCOUNT_ID}/media`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image_url: imageUrl,
          caption,
          access_token: IG_ACCESS_TOKEN,
        }),
      }
    );

    const containerData = await containerRes.json();
    if (!containerRes.ok || containerData.error) {
      console.error("Instagram container error:", containerData.error || containerData);
      return null;
    }

    const creationId = containerData.id;
    if (!creationId) return null;

    // Wait for media to process
    await sleep(3000);

    // Step 2: Publish the container
    const publishRes = await fetch(
      `${GRAPH_API_BASE}/${IG_BUSINESS_ACCOUNT_ID}/media_publish`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creation_id: creationId,
          access_token: IG_ACCESS_TOKEN,
        }),
      }
    );

    const publishData = await publishRes.json();
    if (!publishRes.ok || publishData.error) {
      console.error("Instagram publish error:", publishData.error || publishData);
      return null;
    }

    return publishData.id || null;
  } catch (err) {
    console.error("Instagram publish exception:", err);
    return null;
  }
}

export async function publishToBothPlatforms(
  imageUrl: string,
  summary: string,
  hashtags: string[]
): Promise<{ fbPostId: string | null; igPostId: string | null }> {
  const fbPostId = await publishToFacebook(imageUrl, summary, hashtags);
  await sleep(2000);
  const igPostId = await publishToInstagram(imageUrl, summary, hashtags);
  return { fbPostId, igPostId };
}
