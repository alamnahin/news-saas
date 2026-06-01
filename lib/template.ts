import { CATEGORY_COLORS } from "@/types";

interface TemplateInput {
  category: string;
  headlineLine1: string;
  highlightedWord: string;
  headlineLine2: string;
  subcategory: string;
  sourceDomain: string;
  imageUrl?: string;
}

const LOGO_URLS: Record<string, string> = {
  STEM: `${process.env.NEXT_PUBLIC_BASE_URL}/logos/dhumketu.png`,
  GEOPOLITICAL: `${process.env.NEXT_PUBLIC_BASE_URL}/logos/contemporary.png`,
  SPORTS: `${process.env.NEXT_PUBLIC_BASE_URL}/logos/contemporary.png`,
  HUMANS_OF_BD: `${process.env.NEXT_PUBLIC_BASE_URL}/logos/contemporary.png`,
};

const FALLBACK_GRADIENTS: Record<string, string> = {
  STEM: "background: linear-gradient(135deg, #0f2027, #203a43, #2c5364);",
  GEOPOLITICAL: "background: linear-gradient(135deg, #1a1a2e, #16213e, #0f3460);",
  SPORTS: "background: linear-gradient(135deg, #0f0c29, #302b63, #24243e);",
  HUMANS_OF_BD: "background: linear-gradient(135deg, #1a0533, #2d1b69, #11998e);",
};

export function buildCardHtml(input: TemplateInput): string {
  const {
    category,
    headlineLine1,
    highlightedWord,
    headlineLine2,
    subcategory,
    sourceDomain,
    imageUrl,
  } = input;

  const accentColor = CATEGORY_COLORS[category] || "#00C9A7";
  const logoUrl = LOGO_URLS[category] || LOGO_URLS.GEOPOLITICAL;

  const bgStyle = imageUrl
    ? `background: linear-gradient(to bottom, rgba(0,0,0,0.20) 0%, rgba(0,0,0,0.55) 55%, rgba(0,0,0,0.88) 100%), url('${imageUrl}') center/cover no-repeat;`
    : (FALLBACK_GRADIENTS[category] || FALLBACK_GRADIENTS.STEM);

  return `<!DOCTYPE html>
<html lang="bn">
<head>
<meta charset="UTF-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@300;400;500;600;700&display=swap');
  :root {
    --accent: ${accentColor};
    --white: #FFFFFF;
    --dim: rgba(255,255,255,0.72);
    --card-w: 1080px;
    --card-h: 1350px;
    --pad-x: 72px;
    --pad-y: 64px;
  }
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    width: var(--card-w);
    height: var(--card-h);
    overflow: hidden;
    font-family: 'Hind Siliguri', sans-serif;
    color: var(--white);
    ${bgStyle}
    position: relative;
  }
  .card {
    position: relative;
    width: var(--card-w);
    height: var(--card-h);
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: var(--pad-y) var(--pad-x);
    z-index: 2;
  }
  .top-bar {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    width: 100%;
  }
  .subcategory-pill {
    border-left: 5px solid var(--accent);
    background: rgba(255,255,255,0.12);
    backdrop-filter: blur(8px);
    padding: 10px 22px 10px 18px;
    border-radius: 0 40px 40px 0;
    font-size: 30px;
    font-weight: 600;
  }
  .logo-wrap img {
    height: 150px;
    width: auto;
    filter: drop-shadow(0 2px 8px rgba(0,0,0,0.6));
  }
  .main-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    max-width: 900px;
  }
  .accent-rule {
    width: 80px;
    height: 4px;
    background: var(--accent);
    border-radius: 2px;
    margin-bottom: 36px;
  }
  .headline {
    font-size: 88px;
    font-weight: 700;
    line-height: 1.18;
    margin-bottom: 40px;
    text-shadow: 0 2px 24px rgba(0,0,0,0.55);
  }
  .headline .accent-word {
    color: var(--accent);
    font-weight: 700;
  }
  .caption-divider {
    width: 48px;
    height: 2px;
    background: rgba(255,255,255,0.35);
    margin-bottom: 28px;
  }
  .bottom-bar {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    width: 100%;
  }
  .source-label {
    font-size: 26px;
    font-weight: 500;
    color: rgba(255,255,255,0.55);
  }
  .copyright {
    font-size: 26px;
    color: rgba(255,255,255,0.45);
    text-align: center;
    position: absolute;
    bottom: var(--pad-y);
    left: 50%;
    transform: translateX(-50%);
    white-space: nowrap;
  }
</style>
</head>
<body>
<div class="card">
  <div class="top-bar">
    <div class="subcategory-pill">${subcategory}</div>
    <div class="logo-wrap"><img src="${logoUrl}" alt="logo"></div>
  </div>
  <div class="main-content">
    <div class="accent-rule"></div>
    <h1 class="headline">${headlineLine1} <span class="accent-word">${highlightedWord}</span> ${headlineLine2}</h1>
    <div class="caption-divider"></div>
  </div>
  <div class="bottom-bar">
    <div></div>
    <div class="source-label">সূত্র: ${sourceDomain}</div>
  </div>
  <span class="copyright">© The Contemporary • 2026</span>
</div>
</body>
</html>`;
}
