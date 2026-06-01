import { prisma } from "./prisma";
import { fetchAllNews } from "./serpapi";
import { classifyArticle, generateContent } from "./openai";
import { resolveImage } from "./images";
import { generateCardImage } from "./hcti";
import { publishToBothPlatforms } from "./publisher";
import { getDailyQuotas, incrementQuota, isCategoryQuotaReached } from "./quota";
import { logError } from "./logger";
import { WorkflowResult } from "@/types";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function runWorkflow(triggeredBy = "cron"): Promise<WorkflowResult> {
  const result: WorkflowResult = {
    processed: 0,
    published: 0,
    failed: 0,
    skipped: 0,
    quotaReached: [],
  };

  // Create workflow run record
  const run = await prisma.workflowRun.create({
    data: { triggeredBy, status: "RUNNING" },
  });

  try {
    // Step 1: Fetch news
    console.log("[Workflow] Step 1: Fetching news from SerpAPI...");
    const articles = await fetchAllNews();
    console.log(`[Workflow] Fetched ${articles.length} articles`);

    // Get existing URLs to skip
    const existingUrls = new Set(
      (await prisma.post.findMany({ select: { articleUrl: true } })).map(
        (p) => p.articleUrl
      )
    );

    // Filter out already-processed articles
    const newArticles = articles.filter(
      (a) => a.link && !existingUrls.has(a.link)
    );
    console.log(`[Workflow] ${newArticles.length} new articles to process`);

    // Get current daily quotas
    let quotaCounts = await getDailyQuotas();

    for (const article of newArticles) {
      if (!article.link || !article.title) {
        result.skipped++;
        continue;
      }

      // Step 2: Classify article
      let classification;
      try {
        classification = await classifyArticle(article.title, article.snippet);
      } catch (err) {
        await logError("CLASSIFY", `Failed for: ${article.title}`, String(err));
        result.failed++;
        continue;
      }

      if (
        classification.category === "IRRELEVANT" ||
        classification.confidence < 0.75
      ) {
        result.skipped++;
        continue;
      }

      const category = classification.category;

      // Check quota
      if (await isCategoryQuotaReached(category, quotaCounts)) {
        if (!result.quotaReached.includes(category)) {
          result.quotaReached.push(category);
        }
        result.skipped++;
        continue;
      }

      // Step 3: Generate content
      let content;
      try {
        content = await generateContent(article.title, article.snippet, category);
      } catch (err) {
        await logError("GENERATE_CONTENT", `Failed for: ${article.title}`, String(err));
        result.failed++;
        continue;
      }

      if (!content) {
        result.failed++;
        continue;
      }

      // Step 4: Resolve image
      const { url: imageUrl } = await resolveImage(
        article.thumbnail,
        content.imageQuery,
        category
      );

      // Create initial post record
      let post;
      try {
        post = await prisma.post.create({
          data: {
            category,
            articleUrl: article.link,
            articleTitle: article.title,
            articleSnippet: article.snippet,
            sourceDomain: article.source,
            scrapedImageUrl: imageUrl,
            headlineLine1: content.headlineLine1,
            highlightedWord: content.highlightedWord,
            headlineLine2: content.headlineLine2,
            subcategory: content.subcategory,
            summary: content.summary,
            hashtags: JSON.stringify(content.hashtags),
            status: "PROCESSED",
          },
        });
      } catch (err) {
        await logError("DB_CREATE", `Failed to save post for: ${article.link}`, String(err));
        result.failed++;
        continue;
      }

      result.processed++;

      // Step 5: Generate card image
      await sleep(2500); // Rate limit HCTI
      let cardImageUrl: string | null = null;
      try {
        cardImageUrl = await generateCardImage({
          category,
          headlineLine1: content.headlineLine1,
          highlightedWord: content.highlightedWord,
          headlineLine2: content.headlineLine2,
          subcategory: content.subcategory,
          sourceDomain: article.source,
          imageUrl,
        });
      } catch (err) {
        await logError("HCTI", `Card generation failed for post ${post.id}`, String(err));
      }

      if (!cardImageUrl) {
        await prisma.post.update({
          where: { id: post.id },
          data: { status: "FAILED", errorMessage: "HCTI card generation failed" },
        });
        result.failed++;
        continue;
      }

      await prisma.post.update({
        where: { id: post.id },
        data: { cardImageUrl },
      });

      // Step 6: Publish to Facebook & Instagram
      await sleep(3000);
      try {
        const hashtags = Array.isArray(content.hashtags)
          ? content.hashtags
          : JSON.parse(content.hashtags);

        const { fbPostId, igPostId } = await publishToBothPlatforms(
          cardImageUrl,
          content.summary,
          hashtags
        );

        await prisma.post.update({
          where: { id: post.id },
          data: {
            fbPostId,
            igPostId,
            status: "PUBLISHED",
            publishedAt: new Date(),
          },
        });

        // Step 7: Update quota
        await incrementQuota(category);
        quotaCounts[category] = (quotaCounts[category] || 0) + 1;
        result.published++;
      } catch (err) {
        await logError("PUBLISH", `Publish failed for post ${post.id}`, String(err));
        await prisma.post.update({
          where: { id: post.id },
          data: { status: "FAILED", errorMessage: String(err) },
        });
        result.failed++;
      }
    }

    // Update workflow run record
    await prisma.workflowRun.update({
      where: { id: run.id },
      data: {
        status: "COMPLETED",
        finishedAt: new Date(),
        processed: result.processed,
        published: result.published,
        failed: result.failed,
        summary: JSON.stringify(result),
      },
    });
  } catch (err) {
    await logError("WORKFLOW", "Unhandled workflow error", String(err));
    await prisma.workflowRun.update({
      where: { id: run.id },
      data: { status: "FAILED", finishedAt: new Date(), summary: String(err) },
    });
    throw err;
  }

  return result;
}
