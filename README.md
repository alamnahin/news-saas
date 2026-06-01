# The Contemporary — Bangla News Automation SaaS

A production-ready Next.js 14 (App Router) platform that automatically fetches, classifies, and publishes Bangla news cards to Facebook and Instagram.

## Architecture Overview

```
Cron Job (Vercel) / Manual Trigger
        ↓
SerpAPI → Fetch Bangla news articles (4 categories)
        ↓
OpenAI GPT-4o → Classify articles (STEM/GEO/SPORTS/HUMANS/IRRELEVANT)
        ↓
OpenAI GPT-4o → Generate headlines, summary, hashtags in Bangla
        ↓
Unsplash/SerpAPI → Resolve best image (3-tier fallback)
        ↓
HCTI API → Render 1080×1350px styled card image
        ↓
Facebook Graph API + Instagram Graph API → Publish
        ↓
PostgreSQL → Track posts, quotas, workflow runs
```

## Quick Start

### 1. Clone and Install

```bash
git clone <repo>
cd bangla-news-saas
npm install
```

### 2. Set up environment variables

```bash
cp .env.example .env.local
# Fill in all values in .env.local
```

### 3. Set up the database

```bash
# With PostgreSQL running:
npm run db:push     # Push schema to DB
npm run db:generate # Generate Prisma client
```

### 4. Add logo and placeholder images

Place the following files in `/public/`:
- `logos/dhumketu.png` — Dhumketu logo (for STEM cards)
- `logos/contemporary.png` — The Contemporary logo (for all other cards)
- `placeholders/stem.jpg` — Fallback image for STEM
- `placeholders/geo.jpg` — Fallback image for Geopolitical
- `placeholders/sports.jpg` — Fallback image for Sports
- `placeholders/humans.jpg` — Fallback image for Humans of BD

Recommended card size for logos: at least 300px tall, transparent PNG.

### 5. Run locally

```bash
npm run dev
# Open http://localhost:3000/dashboard
```

### 6. Test the workflow

Visit the dashboard and click **"ওয়ার্কফ্লো চালান"** (Run Workflow) to trigger manually.

Or call the API directly:
```bash
curl -X POST http://localhost:3000/api/manual-trigger
```

---

## Deployment (Vercel)

1. Push to GitHub and connect to Vercel.
2. Add all environment variables in the Vercel dashboard.
3. Add `CRON_SECRET` as a Vercel environment variable.
4. Set up a PostgreSQL database (Vercel Postgres, Supabase, Neon, etc.) and update `DATABASE_URL`.
5. Deploy — cron jobs will start automatically per `vercel.json`.

### Cron Schedule (BD time = UTC+6)

| UTC  | BD Time | Days      |
|------|---------|-----------|
| 02:00 | 08:00  | Weekdays  |
| 05:00 | 11:00  | Weekdays  |
| 08:00 | 14:00  | Weekdays  |
| 11:00 | 17:00  | Weekdays  |
| 14:00 | 20:00  | Weekdays  |
| 03:00 | 09:00  | Weekends  |
| 07:00 | 13:00  | Weekends  |
| 12:00 | 18:00  | Weekends  |

---

## API Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/cron` | GET | Vercel cron handler (requires Bearer token) |
| `/api/manual-trigger` | POST | Manually trigger the full workflow |
| `/api/posts` | GET | Fetch posts with pagination/filtering |
| `/api/workflow-status` | GET | Get latest run, quotas, error logs |

### Query params for `/api/posts`:
- `page` (default: 1)
- `limit` (default: 20)
- `status` — PUBLISHED | PROCESSED | FAILED | PENDING
- `category` — STEM | GEOPOLITICAL | SPORTS | HUMANS_OF_BD

---

## Environment Variables Reference

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `OPENAI_API_KEY` | OpenAI API key (GPT-4o access required) |
| `SERPAPI_API_KEY` | SerpAPI key for Google News |
| `HCTI_USER_ID` | HTML/CSS to Image API user ID |
| `HCTI_API_KEY` | HTML/CSS to Image API key |
| `UNSPLASH_ACCESS_KEY` | Unsplash API access key |
| `FB_PAGE_ID` | Facebook Page ID |
| `FB_PAGE_ACCESS_TOKEN` | Facebook Page Access Token (long-lived) |
| `IG_BUSINESS_ACCOUNT_ID` | Instagram Business Account ID |
| `IG_ACCESS_TOKEN` | Instagram Access Token |
| `NEXT_PUBLIC_BASE_URL` | Full URL of the deployed app |
| `CRON_SECRET` | Secret for Vercel cron authentication |

---

## Daily Post Targets

| Category | Target | Accent Color |
|----------|--------|-------------|
| STEM | 15 | #00C9A7 (Teal) |
| Geopolitical | 5 | #FF6B6B (Red) |
| Sports | 7 | #F9C74F (Yellow) |
| Humans of BD | 3 | #A78BFA (Purple) |
| **Total** | **30** | |

---

## Card Design

Cards are 1080×1350px (portrait, Instagram-optimized) featuring:
- **Hind Siliguri** font (Google Fonts) for Bangla text
- Background photo with dark gradient overlay
- Category color accent stripe and highlighted word
- Logo (Dhumketu for STEM, The Contemporary for others)
- Source attribution and copyright footer

---

## Database Schema

- **Post** — Stores every processed article with all generated content and social media post IDs
- **DailyQuota** — Tracks published count per category per day (BD timezone)
- **ErrorLog** — Logs failures at each workflow step
- **WorkflowRun** — Audit trail of every cron/manual trigger

---

## File Structure

```
/app
  /api
    /cron/route.ts          Vercel cron endpoint
    /manual-trigger/route.ts  Manual workflow trigger
    /posts/route.ts           Posts data API
    /workflow-status/route.ts Status + quota API
  /dashboard/page.tsx       Admin dashboard UI
  layout.tsx
  globals.css
/lib
  prisma.ts     Prisma client singleton
  serpapi.ts    SerpAPI news fetching
  openai.ts     GPT-4o classification + content gen
  hcti.ts       HCTI image generation
  template.ts   HTML card template builder
  images.ts     3-tier image fallback resolver
  publisher.ts  Facebook + Instagram publishing
  quota.ts      Daily quota management
  workflow.ts   Main orchestration logic
  logger.ts     Error logging
/prisma
  schema.prisma
/public
  /logos/
  /placeholders/
/types/index.ts
```
