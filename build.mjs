// Builds the site into dist/: homepage, /blog, one page per post in content/posts, plus
// 404, thanks, sitemap and the RSS feed. Netlify runs this on every push (see netlify.toml).
import { readFileSync, writeFileSync, mkdirSync, readdirSync, rmSync, cpSync, existsSync } from "node:fs";
import { join } from "node:path";
import { createHash } from "node:crypto";
import { Marked } from "marked";
import { themed } from "./theme.mjs";
import { postCard } from "./og-cards.mjs";
import { PROMPTS, FREE, word, TOOLKIT_CSS, TOOLKIT_JS, toolkitHero, toolkitRule, toolkitPrompts, toolkitLocked, toolkitGet, toolkitBeforeYouPaste, toolkitClose, toolkitUnlocked } from "./toolkit.mjs";

const SITE = "https://the10xmanager.academy";
const ROOT = new URL(".", import.meta.url).pathname;
const OUT = join(ROOT, "dist");
const tpl = (name) => readFileSync(join(ROOT, "templates", name), "utf8");
const MONO = "font-family: 'DM Mono', monospace";

// ---- topics: front-matter `topic` → colour, description, archive order
const TOPICS = [
  ["new-managers", "#B7D26C", "Your first year in the job, and deciding to take it"],
  ["managing-up", "#BB99F6", "Working with your own manager and leadership"],
  ["feedback", "#84D2CE", "Feedback, performance reviews and underperformance"],
  ["communication", "#BB99F6", "1:1s, meetings, conflict and saying no"],
  ["careers", "#F4B8A7", "Growing your career, as a manager or an IC"],
  ["hiring", "#F1E27B", "Hiring, onboarding and keeping good people"],
  ["org-design", "#F1E27B", "Reorgs and leading through uncertainty"],
  ["remote", "#84D2CE", "Leading remote and hybrid teams"],
  ["inclusion", "#F4B8A7", "Building diverse, inclusive teams"],
];
const topicOf = (tag) => {
  const i = TOPICS.findIndex((t) => t[0] === tag);
  return i >= 0 ? { tag, color: TOPICS[i][1], desc: TOPICS[i][2], order: i } : { tag: tag || "writing", color: "#B7D26C", desc: "More writing", order: 99 };
};

// ---- "start here" picks on the archive: [slug, blurb]
const START_HERE = [
  ["what-every-new-manager-needs-to-know-about-joining-an-existing-team", "How to build trust and lead effectively when you inherit a team you don't know yet."],
  ["manager-employability", "Stay employable by diversifying your skills, staying visible, and keeping both the manager and IC paths open."],
  ["how-to-survive-a-reorg-as-a-middle-manager", "Break down silos, own the strategy, plan your communication, and advocate for your team."],
];

const SHAPES = [
  '<div style="position: absolute; right: 28px; top: 22px; width: 84px; height: 84px; border-radius: 999px; background: #F4B8A7"></div><div style="position: absolute; right: 88px; top: 56px; width: 96px; height: 60px; border-radius: 14px; background: #84D2CE"></div>',
  '<div style="position: absolute; right: 36px; top: 18px; width: 110px; height: 72px; border-radius: 16px; background: #F1E27B"></div><div style="position: absolute; right: 120px; top: 64px; width: 56px; height: 56px; border-radius: 999px; background: #BB99F6"></div>',
  '<div style="position: absolute; right: 30px; top: 30px; width: 70px; height: 70px; border-radius: 18px; background: #B7D26C; transform: rotate(12deg)"></div><div style="position: absolute; right: 110px; top: 20px; width: 64px; height: 64px; border-radius: 999px; background: #84D2CE"></div>',
];

const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const fmtDate = (iso, opts) => new Date(iso + "T12:00:00Z").toLocaleDateString("en-GB", { timeZone: "UTC", ...opts });

// ---- Markdown: images become figures (the title is the caption); a lone image isn't wrapped in <p>
const md = new Marked({ gfm: true });
md.use({
  renderer: {
    image({ href, title, text }) {
      const cap = title ? `<figcaption>${title}</figcaption>` : "";
      return `<figure><img src="${esc(href)}" alt="${esc(text)}" loading="lazy">${cap}</figure>`;
    },
    paragraph({ tokens }) {
      const real = tokens.filter((t) => !(t.type === "text" && !t.text.trim()));
      if (real.length === 1 && real[0].type === "image") return this.parser.parseInline(tokens) + "\n";
      return `<p>${this.parser.parseInline(tokens)}</p>\n`;
    },
    link({ href, title, tokens }) {
      const ext = /^https?:/.test(href) && !href.startsWith(SITE);
      return `<a href="${esc(href)}"${title ? ` title="${esc(title)}"` : ""}${ext ? ' target="_blank" rel="noopener"' : ""}>${this.parser.parseInline(tokens)}</a>`;
    },
  },
});

// ---- posts
function readPost(file) {
  const raw = readFileSync(join(ROOT, "content/posts", file), "utf8");
  const m = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!m) throw new Error(`${file}: missing front matter`);
  const meta = {};
  for (const line of m[1].split("\n")) {
    const kv = line.match(/^([A-Za-z]+):\s*(.*)$/);
    if (!kv) continue;
    let v = kv[2].trim();
    if (v.startsWith('"')) v = JSON.parse(v);
    meta[kv[1]] = v;
  }
  const slug = file.replace(/\.md$/, "");
  if (!meta.title || !/^\d{4}-\d{2}-\d{2}$/.test(meta.date || "")) throw new Error(`${file}: needs title and date (YYYY-MM-DD)`);
  if (meta.draft === "true") return null;
  const words = m[2].replace(/!\[[^\]]*\]\([^)]*\)/g, "").split(/\s+/).filter(Boolean).length;
  return { slug, ...meta, body: m[2], minutes: Math.max(1, Math.round(words / 230)), topic: topicOf(meta.topic) };
}
const posts = readdirSync(join(ROOT, "content/posts"))
  .filter((f) => f.endsWith(".md"))
  .map(readPost)
  .filter(Boolean)
  .sort((a, b) => b.date.localeCompare(a.date));

const postUrl = (p) => `/post/${p.slug}`;

function header(p) {
  return `<header class="post-head" style="max-width: 768px; margin: 0 auto; padding: 56px 24px 0">
<a href="/blog" class="back-link" style="display: inline-flex; align-items: center; gap: 8px; min-height: 44px; ${MONO}; font-size: 14px; color: #8B93A1">← All writing</a>
<p style="margin: 28px 0 0; display: flex; flex-wrap: wrap; gap: 6px 16px; ${MONO}; font-size: 14px; color: #6E7684"><a href="/blog" style="font-weight: 500; color: ${p.topic.color}">#${esc(p.topic.tag)}</a><time datetime="${p.date}">${fmtDate(p.date, { day: "numeric", month: "short", year: "numeric" })}</time><span>${p.minutes} min read</span></p>
<h1 style="margin: 16px 0 0; ${MONO}; font-weight: 500; font-size: clamp(32px, 4vw, 50px); line-height: 1.16; letter-spacing: -0.05em; color: #F3F5F8">${esc(p.title)}</h1>
${p.excerpt ? `<p style="margin: 24px 0 0; font-size: 20px; line-height: 1.55; color: #AEB5C1">${esc(p.excerpt)}</p>` : ""}
<div style="margin-top: 32px; padding: 20px 0; display: flex; align-items: center; gap: 14px; border-top: 1px solid #1F242C; border-bottom: 1px solid #1F242C"><img src="/assets/portrait.jpg" alt="" style="width: 48px; height: 48px; flex: none; border-radius: 999px; object-fit: cover; object-position: 50% 30%"><div style="line-height: 1.4"><div style="font-size: 16px; font-weight: 600; color: #F3F5F8">Zaharenia Atzitzikaki</div><div style="${MONO}; font-size: 13px; color: #8B93A1">Engineering Leadership Coach</div></div></div>
</header>`;
}

const relatedCard = (p) =>
  `<a href="${postUrl(p)}" class="related-card" style="display: flex; flex-direction: column; padding: 24px; border-radius: 14px; background: #161A20; border: 1px solid #222731; color: inherit"><span style="${MONO}; font-size: 13px; font-weight: 500; color: ${p.topic.color}">#${esc(p.topic.tag)}</span><h3 class="related-title" style="margin: 10px 0 20px; ${MONO}; font-size: 19px; font-weight: 500; line-height: 1.35; letter-spacing: -0.03em; color: #F3F5F8; transition: color .2s ease">${esc(p.title)}</h3><span style="margin-top: auto; ${MONO}; font-size: 13px; color: #6E7684">${p.minutes} min read →</span></a>`;

function headMeta({ title, description, image, url, type = "article" }) {
  return `<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${url}">
<link rel="alternate" type="application/rss+xml" title="The 10x Manager Academy" href="${SITE}/blog-feed.xml">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${url}">
<meta property="og:type" content="${type}">${image ? `\n<meta property="og:image" content="${esc(image)}">\n<meta property="og:image:width" content="2400">\n<meta property="og:image:height" content="1260">` : ""}
<meta name="twitter:card" content="${image ? "summary_large_image" : "summary"}">`;
}

const [headBefore, headAfter] = tpl("post-head.html").split("%%HEADMETA%%");
const postBody = tpl("post-body.html");

function postPage(p) {
  const related = [...posts.filter((x) => x !== p && x.topic.tag === p.topic.tag), ...posts.filter((x) => x !== p && x.topic.tag !== p.topic.tag)].slice(0, 3);
  const meta = headMeta({ title: p.seoTitle || p.title, description: p.seoDescription || p.excerpt || "", image: `${SITE}/assets/og/${p.slug}.png?v=${CARD_VERSION[p.slug]}`, url: SITE + postUrl(p) });
  const body = postBody
    .replace("%%HEADER%%", () => header(p))
    .replace("%%BODY%%", () => md.parse(p.body))
    .replace("%%RELATED%%", () => related.map(relatedCard).join("\n"));
  return `<!doctype html>\n<html lang="en">\n<head>\n${headBefore}${meta}${headAfter}</head>\n<body>${body}</body>\n</html>\n`;
}

// ---- archive
// "Start here" cards: the archive's opening row, reused on the thank-you pages.
function startHere(label = "// start here", pad = "0 24px 88px") {
  const bySlug = new Map(posts.map((p) => [p.slug, p]));
  let html = `<!-- START HERE -->
  <section style="max-width: 1200px; margin: 0 auto; padding: ${pad}">
<h2 style="margin: 0 0 20px; ${MONO}; font-size: 14px; font-weight: 500; letter-spacing: 0.02em; color: #8B93A1">${label}</h2>
<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px">\n`;
  START_HERE.map(([slug, blurb]) => [bySlug.get(slug), blurb])
    .filter(([p]) => p)
    .forEach(([p, blurb], i) => {
      html += `<a href="${postUrl(p)}" class="start-card" style="display: flex; flex-direction: column; border-radius: 14px; background: #161A20; border: 1px solid #222731; overflow: hidden; color: inherit"><div aria-hidden="true" style="position: relative; height: 128px; background: #12161C; border-bottom: 1px solid #222731; overflow: hidden">${SHAPES[i % 3]}<span style="position: absolute; left: 24px; bottom: 16px; ${MONO}; font-size: 40px; font-weight: 500; letter-spacing: -0.05em; color: #F3F5F8">0${i + 1}</span></div><div style="flex: 1; display: flex; flex-direction: column; padding: 24px"><span style="${MONO}; font-size: 13px; font-weight: 500; color: ${p.topic.color}">#${esc(p.topic.tag)}</span><h3 class="start-title" style="margin: 10px 0 0; ${MONO}; font-size: 21px; font-weight: 500; line-height: 1.3; letter-spacing: -0.03em; color: #F3F5F8; transition: color .2s ease">${esc(p.title)}</h3><p style="margin: 12px 0 20px; font-size: 15px; color: #AEB5C1">${esc(blurb || p.excerpt)}</p><span style="margin-top: auto; ${MONO}; font-size: 13px; color: #6E7684">${p.minutes} min read →</span></div></a>\n`;
    });
  return html + `</div>
  </section>`;
}

function archive() {
  let html = startHere();
  html += `
  <!-- ALL WRITING -->
  <section style="max-width: 1200px; margin: 0 auto; padding: 0 24px 96px">
<h2 style="margin: 0; ${MONO}; font-weight: 500; font-size: clamp(26px, 3vw, 36px); line-height: 1.3; letter-spacing: -0.04em; color: #F3F5F8">Browse by topic</h2>
<div style="margin-top: 40px; display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 480px), 1fr)); gap: 56px 48px; align-items: start">\n`;
  const groups = new Map();
  for (const p of posts) {
    if (!groups.has(p.topic.tag)) groups.set(p.topic.tag, { t: p.topic, list: [] });
    groups.get(p.topic.tag).list.push(p);
  }
  for (const g of [...groups.values()].sort((a, b) => a.t.order - b.t.order)) {
    html += `<div>
<h3 style="margin: 0 0 4px; display: flex; flex-direction: column; gap: 4px; padding-bottom: 12px; border-bottom: 1px solid #2A303A"><span style="${MONO}; font-size: 20px; font-weight: 500; letter-spacing: -0.03em; color: ${g.t.color}">#${esc(g.t.tag)}</span><span style="font-size: 15px; font-weight: 500; line-height: 1.45; color: #8B93A1">${esc(g.t.desc)}</span></h3>
<ul style="margin: 0; padding: 0; list-style: none">\n`;
    for (const p of g.list) {
      html += `<li><a href="${postUrl(p)}" class="post-row" style="display: block; padding: 14px 0; border-bottom: 1px solid #1A1F27; color: inherit"><span class="post-title" style="display: block; font-size: 17px; font-weight: 600; line-height: 1.4; color: #F3F5F8">${esc(p.title)}</span><span style="display: block; margin-top: 4px; ${MONO}; font-size: 13px; color: #6E7684">${fmtDate(p.date, { month: "short", year: "numeric" })} · ${p.minutes} min</span></a></li>\n`;
    }
    html += `</ul>\n</div>\n`;
  }
  return html + `</div>\n  </section>`;
}

// A message page in the archive's design (404, form thank-yous), optionally followed by more.
// Share images get ?v=<content hash> so LinkedIn and others refetch them whenever they change
// (they cache images by URL, and the files keep the same name).
const version = (buf) => createHash("sha1").update(buf).digest("hex").slice(0, 8);
const CARD_VERSION = {};
const bustShareImages = (html) =>
  html.replace(/(\/assets\/(share-[a-z]+\.png))"/g, (m, path, file) => `${path}?v=${version(readFileSync(join(ROOT, "static", "assets", file)))}"`);
const blogTpl = bustShareImages(tpl("blog.html"));
const messagePage = (title, heading, text, after = "", { newsletter = true } = {}) => {
  let html = blogTpl
    .replace(/\n<link rel="canonical"[^>]*>\n<meta property="og:url"[^>]*>/, "")
    .replace(/<a href="\/blog" class="nav-link" aria-current="page" style="[^"]*">/, '<a href="/blog" class="nav-link" style="color: #AEB5C1">')
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(title)}</title>\n<meta name="robots" content="noindex">`)
    .replace(/<!-- HERO -->[\s\S]*?%%SECTIONS%%/, `<!-- MESSAGE -->
  <section style="max-width: 1200px; margin: 0 auto; padding: 120px 24px ${after ? "64px" : "120px"}">
<h1 style="margin: 0; ${MONO}; font-weight: 500; font-size: clamp(32px, 4vw, 50px); line-height: 1.16; letter-spacing: -0.05em; color: #F3F5F8">${heading}</h1>
<p style="margin: 24px 0 0; max-width: 680px; font-size: 20px; line-height: 1.55; color: #AEB5C1">${text}</p>
  </section>
${after}`);
  if (!newsletter) html = html.replace(/\s*<!-- NEWSLETTER -->[\s\S]*?<\/section>/, "");
  return html;
};

// ---- privacy policy (content/privacy.md), styled inline to match the message pages
const privacyBody = md
  .parse(readFileSync(join(ROOT, "content", "privacy.md"), "utf8"))
  .replace(/<h2>/g, `<h2 style="margin: 48px 0 14px; ${MONO}; font-weight: 500; font-size: 24px; line-height: 1.3; letter-spacing: -0.04em; color: #F3F5F8">`)
  .replace(/<p>/g, '<p style="margin: 0 0 18px">')
  .replace(/<strong>/g, '<strong style="font-weight: 600; color: #F3F5F8">');
const privacyPage = () =>
  messagePage("Privacy policy · The 10x Manager Academy", "Privacy policy", "What this site collects, why, and what you can ask me to do with it.", `<section style="max-width: 1200px; margin: 0 auto; padding: 0 24px 120px"><div style="max-width: 680px; font-size: 17px; line-height: 1.7; color: #AEB5C1">${privacyBody}</div></section>`)
    .replace('<meta name="robots" content="noindex">', `<meta name="description" content="How The 10x Manager Academy handles your data.">\n<link rel="canonical" href="${SITE}/privacy">`);

// ---- speaking: talks for conference organisers (not in the menu; shared by link)
const TALKS = [
  ["e872400583f84557b849b0bd07c69244", "Voxxed Days", 2022],
  ["9ca3eb5990bb4a7b85833223869bd372", "JS London", 2021],
  ["287a6171c1124115a4e6096d70a04e29", "Greece JS", 2018],
  ["b786fa1fa1b14b9b90c9ef805d7ca09c", "OpenCoffee Heraklion", 2017],
  ["f541a87eed4c471998018c9b58eb58a2", "Devstaff Heraklion", 2016],
  ["803f3b795f2e493b9248b7d6fe28799f", "Devstaff Heraklion", 2015],
  ["3ade459942304a99ac891683a2562b9c", "University of Crete", 2015],
  ["cc9ecfc0c16a0131e0fe72c781b73270", "UpNorth Conference", 2014],
];
const VIDEOS = ["VIi17ioJNDw", "hODZF1Sn2hw", "LxMrZXMJRrk"];
const embedCard = (src, title, caption) =>
  `<li style="display: flex; flex-direction: column; gap: 12px; min-width: 0"><div style="position: relative; aspect-ratio: 16 / 9; border-radius: 12px; overflow: hidden; background: #12161C; border: 1px solid #222731"><iframe src="${src}" title="${esc(title)}" loading="lazy" allowfullscreen allow="encrypted-media; picture-in-picture" style="position: absolute; inset: 0; width: 100%; height: 100%; border: 0"></iframe></div>${caption}</li>`;
const speakingGrid = (items) =>
  `<ul style="list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 440px), 1fr)); gap: 40px 32px">${items.join("")}</ul>`;
const speakingLabel = (text) =>
  `<h2 style="margin: 0 0 28px; ${MONO}; font-size: 15px; font-weight: 500; letter-spacing: 0.02em; color: #B7D26C">${text}</h2>`;
const speakingPage = () =>
  messagePage(
    "Speaking · Zaharenia Atzitzikaki",
    "Speaking",
    'Talks I\'ve given at conferences, meetups and universities since 2014. To invite me to speak, email <a href="mailto:hello@the10xmanager.academy">hello@the10xmanager.academy</a>.',
    `<section style="max-width: 1200px; margin: 0 auto; padding: 0 24px 72px">${speakingLabel("// slides")}${speakingGrid(
      TALKS.map(([id, event, year]) =>
        embedCard(`https://speakerdeck.com/player/${id}`, `Slides from ${event}, ${year}`, `<p style="margin: 0; ${MONO}; font-size: 14px; color: #AEB5C1">${esc(event)} <span style="color: #6E7684">· ${year}</span></p>`),
      ),
    )}</section>
<section style="max-width: 1200px; margin: 0 auto; padding: 0 24px 120px">${speakingLabel("// videos")}${speakingGrid(
      VIDEOS.map((id, i) => embedCard(`https://www.youtube-nocookie.com/embed/${id}`, `Talk video ${i + 1}`, "")),
    )}</section>`,
  ).replace('<meta name="robots" content="noindex">', `<meta name="description" content="Talks by Zaharenia Atzitzikaki on leadership, management and design.">\n<link rel="canonical" href="${SITE}/speaking">`);

// ---- AI toolkit (newsletter incentive): /toolkit previews it, /toolkit-full is the whole kit,
// linked from /confirmed after someone confirms their subscription. Prompts: content/toolkit.mjs.
const TOOLKIT_DESC = `Seven copy-ready AI prompts for engineering managers: feedback, team pulse, performance reviews, promotion cases, hard conversations, hiring and onboarding.`;
function toolkitPage({ title, path, index, newsletterHref, hero, sections }) {
  const card = `${SITE}/assets/og/toolkit.png?v=${CARD_VERSION.toolkit}`;
  return messagePage(title, "", "", sections, { newsletter: false })
    .replace(/<!-- MESSAGE -->[\s\S]*?<\/section>/, () => hero)
    .replace('<meta name="robots" content="noindex">', index ? `<meta name="description" content="${esc(TOOLKIT_DESC)}">\n<link rel="canonical" href="${SITE}${path}">\n<meta property="og:url" content="${SITE}${path}">` : '<meta name="robots" content="noindex">')
    .replace(/<meta property="og:title" content="[^"]*">/, `<meta property="og:title" content="${esc(title)}">`)
    .replace(/<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${esc(TOOLKIT_DESC)}">`)
    .replace(/<meta property="og:image" content="[^"]*">/, `<meta property="og:image" content="${card}">`)
    .replace(/href="#newsletter"/g, `href="${newsletterHref}"`)
    .replace("</head>", TOOLKIT_CSS + "\n</head>")
    .replace("</body>", TOOLKIT_JS + "\n</body>");
}
const toolkitPreview = () =>
  toolkitPage({
    title: "The AI toolkit for engineering managers · The 10x Manager Academy",
    path: "/toolkit",
    index: true,
    newsletterHref: "#get",
    hero: toolkitHero('AI prompts for the parts of the job that were <mark class="hl">never the job.</mark>', `${word(PROMPTS.length)[0].toUpperCase() + word(PROMPTS.length).slice(1)} copy-ready prompts for the assembly work of managing: feedback, reviews, promotion cases, hard conversations, hiring and onboarding. The first ${word(FREE)} are below. Subscribe to the newsletter and you get all of them.`),
    sections: [toolkitRule(), toolkitPrompts(), toolkitLocked(), toolkitGet(), toolkitBeforeYouPaste(), toolkitClose()].join("\n"),
  });
const toolkitFull = () =>
  toolkitPage({
    title: "Your AI toolkit · The 10x Manager Academy",
    path: "/toolkit-full",
    index: false,
    newsletterHref: "/#newsletter",
    hero: toolkitHero('Your toolkit: <mark class="hl">all seven prompts.</mark>', "Bookmark this page. Copy a prompt, fill in the brackets with whatever you can grab in two minutes, and check the output against what you actually know.", { cta: false }),
    sections: [
      toolkitRule(),
      toolkitPrompts(PROMPTS.slice(0, FREE), "// every week"),
      toolkitPrompts(PROMPTS.slice(FREE, 5), "// review season", FREE),
      toolkitPrompts(PROMPTS.slice(5), "// hiring", 5),
      toolkitBeforeYouPaste(),
      toolkitClose(`<p style="margin: 24px 0 0; font-size: 17px; color: #AEB5C1">Used one of these? Reply to any newsletter issue and tell me how it went. I read every reply.</p>`),
    ].join("\n"),
  });

// ---- RSS (same address as the old Wix feed) and sitemap
const xml = (s) => esc(s).replace(/'/g, "&apos;");
const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
<title>The 10x Manager Academy</title>
<link>${SITE}/blog</link>
<description>Field notes on managing people, by Zaharenia Atzitzikaki.</description>
<language>en</language>
<atom:link href="${SITE}/blog-feed.xml" rel="self" type="application/rss+xml"/>
${posts
  .slice(0, 20)
  .map((p) => `<item><title>${xml(p.title)}</title><link>${SITE}${postUrl(p)}</link><guid>${SITE}${postUrl(p)}</guid><pubDate>${new Date(p.date + "T08:00:00Z").toUTCString()}</pubDate><description>${xml(p.excerpt || "")}</description></item>`)
  .join("\n")}
</channel>
</rss>
`;
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
<url><loc>${SITE}/</loc></url>
<url><loc>${SITE}/privacy</loc></url>
<url><loc>${SITE}/speaking</loc></url>
<url><loc>${SITE}/toolkit</loc></url>
<url><loc>${SITE}/blog</loc><lastmod>${posts[0]?.date ?? ""}</lastmod></url>
${posts.map((p) => `<url><loc>${SITE}${postUrl(p)}</loc><lastmod>${p.date}</lastmod></url>`).join("\n")}
</urlset>
`;

// ---- write
rmSync(OUT, { recursive: true, force: true });
mkdirSync(join(OUT, "post"), { recursive: true });
if (existsSync(join(ROOT, "static"))) cpSync(join(ROOT, "static"), OUT, { recursive: true });
// One share card per post (logo, #topic, title, read time).
mkdirSync(join(OUT, "assets", "og"), { recursive: true });
for (const p of posts) {
  const png = await postCard({ title: p.title, tag: p.topic.tag, color: p.topic.color, minutes: p.minutes });
  writeFileSync(join(OUT, "assets", "og", `${p.slug}.png`), png);
  CARD_VERSION[p.slug] = version(png);
}
{
  const png = await postCard({ title: "AI prompts for the parts of the job that were never the job", tag: "toolkit", color: "#B7D26C", meta: "Seven copy-ready prompts for engineering managers" });
  writeFileSync(join(OUT, "assets", "og", "toolkit.png"), png);
  CARD_VERSION.toolkit = version(png);
}
writeFileSync(join(OUT, "index.html"), themed(bustShareImages(tpl("home.html"))));
writeFileSync(join(OUT, "blog.html"), themed(blogTpl.replace("%%SECTIONS%%", archive())));
for (const p of posts) writeFileSync(join(OUT, "post", `${p.slug}.html`), themed(postPage(p)));
writeFileSync(join(OUT, "privacy.html"), themed(privacyPage()));
writeFileSync(join(OUT, "speaking.html"), themed(speakingPage()));
writeFileSync(join(OUT, "toolkit.html"), themed(toolkitPreview()));
writeFileSync(join(OUT, "toolkit-full.html"), themed(toolkitFull()));
writeFileSync(join(OUT, "404.html"), themed(messagePage("Page not found · The 10x Manager Academy", "This page doesn't exist.", 'It may have moved. Try <a href="/blog">all writing</a> or the <a href="/">homepage</a>.')));
const CALL = "https://calendar.app.google/crG9ExWinyMXmka69";
writeFileSync(join(OUT, "thanks.html"), themed(messagePage("Thanks · The 10x Manager Academy", "Thanks, I've got your note.", `I read every message myself and will reply by email. Want to talk sooner? <a href="${CALL}" target="_blank" rel="noopener">Book a free scoping call</a>.`, startHere("// while you wait", "0 24px 120px"))));
// After the signup form: double opt-in means they still have to confirm by email.
writeFileSync(join(OUT, "subscribed.html"), themed(messagePage("Check your inbox · The 10x Manager Academy", "One more step: check your inbox.", "I've sent you an email with a button to confirm your subscription. Click it and you'll land on the full AI toolkit. The email can take a minute to arrive. If you can't find it, check your spam or promotions folder.", startHere("// while you wait", "0 24px 120px"), { newsletter: false })));
// Where beehiiv sends people after they click the confirmation button (opt_in_redirect_url).
writeFileSync(join(OUT, "confirmed.html"), themed(messagePage("You're subscribed · The 10x Manager Academy", "You're in.", "Your subscription is confirmed, and the next issue will land in your inbox. Your toolkit is ready, and below it is where most readers start.", toolkitUnlocked() + "\n" + startHere("// start here", "0 24px 120px"), { newsletter: false })));
writeFileSync(join(OUT, "subscribe-error.html"), themed(messagePage("Something went wrong · The 10x Manager Academy", "That didn't go through.", `Your email wasn't added. Please check it and <a href="/#newsletter">try again</a>, or email <a href="mailto:hello@the10xmanager.academy">hello@the10xmanager.academy</a> and I'll add you myself.`)));
writeFileSync(join(OUT, "blog-feed.xml"), rss);
writeFileSync(join(OUT, "sitemap.xml"), sitemap);
writeFileSync(join(OUT, "robots.txt"), `User-agent: *\nAllow: /\n\nSitemap: ${SITE}/sitemap.xml\n`);
console.log(`built ${posts.length} posts into dist/`);
