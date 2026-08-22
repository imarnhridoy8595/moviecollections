// build.js — generates the static moviecollections.inazira.com site
// Run: node build.js
// Reads data/movies.json, writes plain HTML into /dist (ready for GitHub Pages)

const fs = require("fs");
const path = require("path");

const DATA_PATH = path.join(__dirname, "data", "movies.json");
const OUT_DIR = path.join(__dirname, "dist");
const SITE_NAME = "MOVIE COLLECTIONS";
const SITE_TAGLINE = "Classic & Public Domain Film Collection";
const SITE_URL = "https://moviecollections.inazira.com";

const movies = JSON.parse(fs.readFileSync(DATA_PATH, "utf-8"));

function slugify(str) {
  return str.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

// ---------- Shared brand styles (INAZIRA design system) ----------
const BASE_CSS = `
:root {
  --adc-navy: #0f1c2e;
  --adc-navy-2: #16273d;
  --adc-brass: #c89b3c;
  --adc-brass-light: #e6c878;
  --adc-ivory: #ede6d6;
  --adc-teal: #3a6b65;
  --adc-muted: #93a1b0;
  --adc-error: #d97757;
}
* { box-sizing: border-box; }
body {
  margin: 0;
  background: linear-gradient(180deg, var(--adc-navy) 0%, var(--adc-navy-2) 100%);
  color: var(--adc-ivory);
  font-family: 'Source Sans 3', system-ui, sans-serif;
  min-height: 100vh;
}
.wrap { max-width: 1080px; margin: 0 auto; padding: 0 24px; }

/* Header */
.site-header { padding: 40px 0 24px; text-align: center; }
.eyebrow {
  display: flex; align-items: center; justify-content: center; gap: 16px;
  color: var(--adc-brass-light); letter-spacing: 0.35em; font-size: 12px;
  text-transform: uppercase; margin-bottom: 18px;
}
.eyebrow-line {
  height: 1px; width: 120px;
  background: linear-gradient(90deg, transparent, var(--adc-brass) 100%);
}
.eyebrow-line.right { background: linear-gradient(270deg, transparent, var(--adc-brass) 100%); }
.site-title {
  font-family: 'Playfair Display', Georgia, serif;
  font-weight: 700; font-size: 42px; color: var(--adc-brass-light);
  margin: 0 0 6px;
}
.site-tagline { color: var(--adc-muted); font-size: 15px; margin: 0; }
nav.crumbs { margin-top: 18px; font-size: 13px; color: var(--adc-muted); }
nav.crumbs a { color: var(--adc-brass-light); text-decoration: none; }

/* Grid */
.grid {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 24px; margin: 32px 0 60px;
}
.card {
  background: linear-gradient(160deg, var(--adc-navy) 0%, var(--adc-navy-2) 100%);
  border: 1px solid rgba(200,155,60,0.25);
  border-radius: 10px; padding: 18px; text-decoration: none; color: inherit;
  display: block; transition: transform 0.15s ease, border-color 0.15s ease;
}
.card:hover { transform: translateY(-3px); border-color: var(--adc-brass); }
.card .badge {
  display: inline-block; font-size: 11px; letter-spacing: 0.08em;
  color: var(--adc-navy); background: var(--adc-brass); border-radius: 4px;
  padding: 2px 8px; margin-bottom: 10px; text-transform: uppercase;
}
.card h3 {
  font-family: 'Playfair Display', Georgia, serif; color: var(--adc-brass-light);
  font-size: 19px; margin: 0 0 6px;
}
.card .meta { color: var(--adc-muted); font-size: 13px; margin: 0; }

/* Detail page */
.detail { padding: 24px 0 60px; }
.detail .badge {
  display: inline-block; font-size: 11px; letter-spacing: 0.08em;
  color: var(--adc-navy); background: var(--adc-brass); border-radius: 4px;
  padding: 3px 10px; margin-bottom: 14px; text-transform: uppercase;
}
.detail h1 {
  font-family: 'Playfair Display', Georgia, serif; color: var(--adc-brass-light);
  font-size: 34px; margin: 0 0 8px;
}
.detail .meta-row { color: var(--adc-muted); font-size: 14px; margin-bottom: 22px; }
.player { position: relative; padding-top: 56.25%; margin-bottom: 24px; border-radius: 8px; overflow: hidden; border: 1px solid rgba(200,155,60,0.25); }
.player iframe { position: absolute; inset: 0; width: 100%; height: 100%; border: 0; }
.detail p.desc { line-height: 1.7; color: var(--adc-ivory); max-width: 68ch; }
.actions { margin-top: 22px; display: flex; gap: 12px; flex-wrap: wrap; }
.btn {
  display: inline-block; background: var(--adc-brass); color: var(--adc-navy);
  padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 14px;
}
.btn.secondary { background: transparent; color: var(--adc-brass-light); border: 1px solid var(--adc-brass); }
.source-note { margin-top: 28px; font-size: 12.5px; color: var(--adc-muted); border-top: 1px solid rgba(200,155,60,0.2); padding-top: 16px; }

/* Footer */
footer.site-footer { border-top: 1px solid rgba(200,155,60,0.2); padding: 24px 0 40px; text-align: center; }
footer.site-footer p { color: var(--adc-muted); font-size: 12.5px; margin: 0; }
`;

function pageShell({ title, body, crumbs }) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Source+Sans+3:wght@400;600&display=swap" rel="stylesheet">
<style>${BASE_CSS}</style>
</head>
<body>
<div class="wrap">
  <header class="site-header">
    <div class="eyebrow">
      <span class="eyebrow-line"></span>
      <span>INAZIRA</span>
      <span class="eyebrow-line right"></span>
    </div>
    <h1 class="site-title"><a href="/" style="color:inherit;text-decoration:none;">${SITE_NAME}</a></h1>
    <p class="site-tagline">${SITE_TAGLINE}</p>
    ${crumbs ? `<nav class="crumbs">${crumbs}</nav>` : ""}
  </header>
  ${body}
  <footer class="site-footer">
    <p>&copy; 2026 INAZIRA. All Rights Reserved. All titles are public domain or openly licensed — see each film's source note.</p>
  </footer>
</div>
</body>
</html>`;
}

// ---------- Home page ----------
function renderHome(movies) {
  const cards = movies.map(m => `
    <a class="card" href="/movies/${slugify(m.title)}/">
      <span class="badge">${m.genre[0] || "Film"}</span>
      <h3>${m.title}</h3>
      <p class="meta">${m.year} &middot; ${m.director}</p>
    </a>`).join("\n");

  const body = `<main><div class="grid">${cards}</div></main>`;
  return pageShell({ title: `${SITE_NAME} — ${SITE_TAGLINE}`, body });
}

// ---------- Movie detail page ----------
function renderMovie(m) {
  const embedUrl = `https://archive.org/embed/${m.identifier}`;
  const detailsUrl = `https://archive.org/details/${m.identifier}`;
  const downloadUrl = `https://archive.org/download/${m.identifier}`;

  const body = `<main class="detail">
    <span class="badge">${m.genre.join(" / ")}</span>
    <h1>${m.title}</h1>
    <p class="meta-row">${m.year} &middot; Directed by ${m.director} &middot; ${m.runtime_minutes} min</p>
    <div class="player">
      <iframe src="${embedUrl}" allowfullscreen></iframe>
    </div>
    <p class="desc">${m.description}</p>
    <div class="actions">
      <a class="btn" href="${downloadUrl}" target="_blank" rel="noopener">Download on Archive.org</a>
      <a class="btn secondary" href="${detailsUrl}" target="_blank" rel="noopener">View source page</a>
    </div>
    <p class="source-note">Hosted and streamed directly from the Internet Archive (archive.org), identifier: <code>${m.identifier}</code>. This title is in the public domain or released under an open license — verify status on the source page before relying on it for redistribution.</p>
  </main>`;

  return pageShell({
    title: `${m.title} (${m.year}) — ${SITE_NAME}`,
    body,
    crumbs: `<a href="/">Home</a> / ${m.title}`
  });
}

// ---------- Write files ----------
fs.rmSync(OUT_DIR, { recursive: true, force: true });
fs.mkdirSync(OUT_DIR, { recursive: true });

fs.writeFileSync(path.join(OUT_DIR, "index.html"), renderHome(movies));

for (const m of movies) {
  const dir = path.join(OUT_DIR, "movies", slugify(m.title));
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "index.html"), renderMovie(m));
}

// CNAME file for GitHub Pages custom subdomain
fs.writeFileSync(path.join(OUT_DIR, "CNAME"), "moviecollections.inazira.com\n");

console.log(`Built ${movies.length} movie pages into /dist`);
