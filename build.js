// build.js — generates the static moviecollections.inazira.com site
// Run: node build.js
// Reads data/movies.json, writes plain HTML into /dist (ready for GitHub Pages)

const fs = require("fs");
const path = require("path");

const DATA_PATH = path.join(__dirname, "data", "movies.json");
const OUT_DIR = path.join(__dirname, "dist");
const SITE_NAME = "MOVIE COLLECTIONS";
const SITE_TAGLINE = "Classic & Public Domain Film Collection";

const raw = JSON.parse(fs.readFileSync(DATA_PATH, "utf-8"));

// ---------- Normalize data (fill defaults for new fields) ----------
const movies = raw.map(m => ({
  type: "movie",          // movie | series | tvshow | documentary | other
  language: "English",
  collections: [],
  ...m,
  genre: m.genre || []
}));

function slugify(str) {
  return String(str).toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}
function posterUrl(identifier) {
  return `https://archive.org/services/img/${identifier}`;
}
function uniqueValues(list, getter) {
  const set = new Set();
  list.forEach(item => (Array.isArray(getter(item)) ? getter(item) : [getter(item)])
    .filter(Boolean).forEach(v => set.add(v)));
  return [...set];
}

// ---------- Top navigation ----------
const NAV = [
  { label: "Home", href: "/", type: "home" },
  { label: "Movies", href: "/movies/", type: "movie" },
  { label: "Movie Series", href: "/movie-series/", type: "series" },
  { label: "TV Shows", href: "/tv-shows/", type: "tvshow" },
  { label: "Awards & Documentaries", href: "/documentaries/", type: "documentary" },
  { label: "Others", href: "/others/", type: "other" },
  { label: "Animations & Cartoons", href: "/animations-cartoons/", type: "animations" },
  { label: "Contact", href: "/contact/", type: null }
];

// ---------- Shared brand styles ----------
const BASE_CSS = `
:root {
  --adc-navy: #0f1c2e;
  --adc-navy-2: #16273d;
  --adc-navy-3: #0a1420;
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
a { color: inherit; }
.wrap { max-width: 1440px; margin: 0 auto; padding: 0 32px; }

/* Top bar: logo + nav + search, all in one row on desktop */
.topbar {
  background: var(--adc-navy-3);
  border-bottom: 1px solid rgba(200,155,60,0.2);
  position: sticky; top: 0; z-index: 20;
}
.topbar-inner {
  max-width: 1440px; margin: 0 auto; padding: 12px 32px;
  display: flex; align-items: center; gap: 24px; flex-wrap: wrap;
}
.logo {
  display: flex; flex-direction: column; line-height: 1.1;
  text-decoration: none; white-space: nowrap; order: 1;
}
.logo-main {
  font-family: 'Playfair Display', Georgia, serif; font-weight: 700;
  font-size: 19px; color: var(--adc-brass-light);
}
.logo-sub {
  font-size: 10px; letter-spacing: 0.2em; color: var(--adc-muted);
  text-transform: uppercase; margin-top: 2px;
}
.topnav {
  display: flex; gap: 22px; flex-wrap: wrap; flex: 1; order: 2;
}
.topnav a {
  color: var(--adc-ivory); text-decoration: none; font-size: 15.5px;
  font-weight: 600; letter-spacing: 0.02em; opacity: 0.85;
  padding: 6px 0; border-bottom: 2px solid transparent; white-space: nowrap;
}
.topnav a:hover, .topnav a.active { opacity: 1; border-bottom-color: var(--adc-brass); }

.search-wrap { position: relative; width: 190px; flex: none; order: 3; }
.search-input {
  width: 100%; background: var(--adc-navy-2); border: 1px solid rgba(200,155,60,0.3);
  border-radius: 6px; padding: 8px 12px; color: var(--adc-ivory); font-size: 13.5px;
}
.search-input::placeholder { color: var(--adc-muted); }
.search-input:focus { outline: none; border-color: var(--adc-brass); }
.search-results {
  position: absolute; top: calc(100% + 6px); left: 0; right: 0;
  background: var(--adc-navy-2); border: 1px solid rgba(200,155,60,0.3);
  border-radius: 8px; max-height: 340px; overflow-y: auto; display: none; z-index: 30;
}
.search-results.open { display: block; }
.search-results a {
  display: flex; justify-content: space-between; gap: 10px;
  padding: 10px 14px; text-decoration: none; font-size: 14px;
  border-bottom: 1px solid rgba(200,155,60,0.12);
}
.search-results a:hover { background: rgba(200,155,60,0.12); }
.search-results .sr-meta { color: var(--adc-muted); font-size: 12px; white-space: nowrap; }
.search-empty { padding: 12px 14px; color: var(--adc-muted); font-size: 13px; }

/* Header */
.site-header { padding: 40px 0 20px; text-align: center; }
.eyebrow {
  display: flex; align-items: center; justify-content: center; gap: 16px;
  color: var(--adc-brass-light); letter-spacing: 0.35em; font-size: 12px;
  text-transform: uppercase; margin-bottom: 18px;
}
.eyebrow-line { height: 1px; width: 120px; background: linear-gradient(90deg, transparent, var(--adc-brass) 100%); }
.eyebrow-line.right { background: linear-gradient(270deg, transparent, var(--adc-brass) 100%); }
.site-title { font-family: 'Playfair Display', Georgia, serif; font-weight: 700; font-size: 40px; color: var(--adc-brass-light); margin: 0 0 6px; }
.site-tagline { color: var(--adc-muted); font-size: 15px; margin: 0; }
nav.crumbs { margin-top: 18px; font-size: 13px; color: var(--adc-muted); }
nav.crumbs a { color: var(--adc-brass-light); text-decoration: none; }

/* Category shelves (home page) */
.shelf { margin: 34px 0; }
.shelf-title {
  font-family: 'Playfair Display', Georgia, serif; color: var(--adc-brass-light);
  font-size: 22px; margin: 0 0 16px; padding-left: 2px;
}
.shelf-row {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
  gap: 16px; padding-bottom: 10px;
}
.cat-card {
  height: 100px; border-radius: 10px;
  display: flex; align-items: flex-end; padding: 14px; text-decoration: none;
  position: relative; overflow: hidden; border: 1px solid rgba(200,155,60,0.25);
  background: linear-gradient(135deg, var(--cat-a, #1a2c44), var(--cat-b, #0f1c2e));
}
.cat-card span {
  position: relative; z-index: 1; font-family: 'Playfair Display', Georgia, serif;
  color: #fff; font-size: 17px; font-weight: 700; text-shadow: 0 2px 6px rgba(0,0,0,0.6);
}
.cat-card:hover { border-color: var(--adc-brass); }

/* Poster grid */
.grid {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
  gap: 22px; margin: 20px 0 60px;
}
.card {
  text-decoration: none; color: inherit; display: block;
  border-radius: 10px; overflow: hidden; border: 1px solid rgba(200,155,60,0.2);
  background: var(--adc-navy-2); transition: transform 0.15s ease, border-color 0.15s ease;
}
.card:hover { transform: translateY(-3px); border-color: var(--adc-brass); }
.card .poster {
  width: 100%; aspect-ratio: 2/3; background-size: cover; background-position: center;
  background-color: var(--adc-navy-3);
}
.card .card-body { padding: 12px 14px; text-align: center; }
.card .badge {
  display: inline-block; font-size: 10.5px; letter-spacing: 0.06em;
  color: var(--adc-navy); background: var(--adc-brass); border-radius: 4px;
  padding: 2px 7px; margin-bottom: 8px; text-transform: uppercase;
}
.card h3 { font-family: 'Playfair Display', Georgia, serif; color: var(--adc-brass-light); font-size: 16px; margin: 0 0 4px; line-height: 1.3; }
.card .meta { color: var(--adc-muted); font-size: 12px; margin: 0; }

.section-heading {
  font-family: 'Playfair Display', Georgia, serif; color: var(--adc-brass-light);
  font-size: 28px; margin: 30px 0 4px;
}
.section-sub { color: var(--adc-muted); font-size: 14px; margin: 0 0 10px; }
.empty-note { color: var(--adc-muted); padding: 30px 0 60px; font-size: 14px; }

/* Detail page */
.detail { padding: 24px 0 60px; }
.detail .badge {
  display: inline-block; font-size: 11px; letter-spacing: 0.08em;
  color: var(--adc-navy); background: var(--adc-brass); border-radius: 4px;
  padding: 3px 10px; margin-bottom: 14px; text-transform: uppercase;
}
.detail h1 { font-family: 'Playfair Display', Georgia, serif; color: var(--adc-brass-light); font-size: 34px; margin: 0 0 8px; }
.detail .meta-row { color: var(--adc-muted); font-size: 14px; margin-bottom: 22px; }
.player { position: relative; padding-top: 56.25%; margin-bottom: 24px; border-radius: 8px; overflow: hidden; border: 1px solid rgba(200,155,60,0.25); }
.player iframe { position: absolute; inset: 0; width: 100%; height: 100%; border: 0; }
.detail p.desc { line-height: 1.7; color: var(--adc-ivory); max-width: 68ch; }
.actions { margin-top: 22px; display: flex; gap: 12px; flex-wrap: wrap; }
.btn { display: inline-block; background: var(--adc-brass); color: var(--adc-navy); padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 14px; }
.btn.secondary { background: transparent; color: var(--adc-brass-light); border: 1px solid var(--adc-brass); }
.source-note { margin-top: 28px; font-size: 12.5px; color: var(--adc-muted); border-top: 1px solid rgba(200,155,60,0.2); padding-top: 16px; }

/* Contact page */
.contact-box { max-width: 520px; margin: 20px auto 60px; text-align: center; }
.contact-box p { color: var(--adc-ivory); line-height: 1.7; }
.contact-box a { color: var(--adc-brass-light); }

/* Footer */
footer.site-footer { border-top: 1px solid rgba(200,155,60,0.2); padding: 24px 0 40px; text-align: center; }
footer.site-footer p { color: var(--adc-muted); font-size: 12.5px; margin: 0; }

@media (max-width: 640px) {
  .topnav { order: 3; flex-basis: 100%; gap: 14px; justify-content: flex-start; }
  .search-wrap { width: 140px; }
  .grid { grid-template-columns: repeat(2, 1fr); gap: 12px; }
}
`;

// ---------- Client-side search script ----------
function searchScript(movies) {
  const index = movies.map(m => ({
    t: m.title, y: m.year, u: `/movies/${slugify(m.title)}/`
  }));
  return `
<script>
const SEARCH_INDEX = ${JSON.stringify(index)};
document.querySelectorAll('.search-input').forEach(function(input) {
  const results = input.parentElement.querySelector('.search-results');
  input.addEventListener('input', function() {
    const q = input.value.trim().toLowerCase();
    if (!q) { results.classList.remove('open'); results.innerHTML = ''; return; }
    const matches = SEARCH_INDEX.filter(function(m) { return m.t.toLowerCase().includes(q); }).slice(0, 8);
    results.innerHTML = matches.length
      ? matches.map(function(m) {
          return '<a href="' + m.u + '"><span>' + m.t + '</span><span class="sr-meta">' + (m.y || '') + '</span></a>';
        }).join('')
      : '<div class="search-empty">No titles found.</div>';
    results.classList.add('open');
  });
  document.addEventListener('click', function(e) {
    if (!input.parentElement.contains(e.target)) results.classList.remove('open');
  });
});
</script>`;
}

// ---------- Page shell ----------
function pageShell({ title, body, crumbs, activeType, movies, showHeader = true }) {
  const navHtml = NAV.map(n =>
    `<a href="${n.href}"${n.type === activeType ? ' class="active"' : ''}>${n.label}</a>`
  ).join("\n");

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
<div class="topbar">
  <div class="topbar-inner">
    <a class="logo" href="/">
      <span class="logo-main">INAZIRA</span>
      <span class="logo-sub">MOVIES</span>
    </a>
    <nav class="topnav">${navHtml}</nav>
    <div class="search-wrap">
      <input class="search-input" type="text" placeholder="Search titles...">
      <div class="search-results"></div>
    </div>
  </div>
</div>
<div class="wrap">
  ${showHeader ? `
  <header class="site-header">
    <div class="eyebrow">
      <span class="eyebrow-line"></span>
      <span>INAZIRA</span>
      <span class="eyebrow-line right"></span>
    </div>
    <h1 class="site-title"><a href="/" style="text-decoration:none;">${SITE_NAME}</a></h1>
    <p class="site-tagline">${SITE_TAGLINE}</p>
    ${crumbs ? `<nav class="crumbs">${crumbs}</nav>` : ""}
  </header>` : ""}
  ${body}
  <footer class="site-footer">
    <p>&copy; 2026 INAZIRA. All Rights Reserved. All titles are public domain or openly licensed — see each film's source note.</p>
  </footer>
</div>
${searchScript(movies)}
</body>
</html>`;
}

// ---------- Reusable: poster card ----------
function movieCard(m) {
  return `<a class="card" href="/movies/${slugify(m.title)}/">
    <div class="poster" style="background-image:url('${posterUrl(m.identifier)}')"></div>
    <div class="card-body">
      <span class="badge">${m.genre[0] || m.type}</span>
      <h3>${m.title}</h3>
      <p class="meta">${m.year || ""}</p>
    </div>
  </a>`;
}

function movieGridOrEmpty(list, emptyMsg) {
  if (!list.length) return `<p class="empty-note">${emptyMsg}</p>`;
  return `<div class="grid">${list.map(movieCard).join("\n")}</div>`;
}

// ---------- Category card colors (cycled) ----------
const CAT_COLORS = [
  ["#3a2a1a", "#0f1c2e"], ["#1a2c44", "#0f1c2e"], ["#2a1a2e", "#0f1c2e"],
  ["#1a3a34", "#0f1c2e"], ["#3a1a1a", "#0f1c2e"], ["#2e2a1a", "#0f1c2e"]
];
function catCard(label, href, i) {
  const [a, b] = CAT_COLORS[i % CAT_COLORS.length];
  return `<a class="cat-card" href="${href}" style="--cat-a:${a};--cat-b:${b}"><span>${label}</span></a>`;
}

// ---------- Home page ----------
function renderHome(movies) {
  const languages = ["English", "Hindi", "Korean", "Bengali", "Other Languages"];
  const collections = ["Charlie Chaplin", "Mr Bean", "James Bond", "Sherlock Holmes", "Animations", "Cartoons", "IMDb Top Movies"];
  const genres = ["Horror", "Sci-Fi", "Romantic", "Animations", "Cartoons"];
  const dataGenres = uniqueValues(movies, m => m.genre).filter(g => !genres.includes(g));

  const body = `<main>
    <section class="shelf">
      <h2 class="shelf-title">Browse by Language</h2>
      <div class="shelf-row">${languages.map((l, i) => catCard(l, `/language/${slugify(l)}/`, i)).join("")}</div>
    </section>

    <section class="shelf">
      <h2 class="shelf-title">Collections</h2>
      <div class="shelf-row">${collections.map((c, i) => catCard(c, `/collection/${slugify(c)}/`, i + 2)).join("")}</div>
    </section>

    <section class="shelf">
      <h2 class="shelf-title">Browse by Genre</h2>
      <div class="shelf-row">${[...genres, ...dataGenres].map((g, i) => catCard(g, `/genre/${slugify(g)}/`, i + 4)).join("")}</div>
    </section>

    <section class="shelf">
      <h2 class="shelf-title">Recently Added</h2>
      ${movieGridOrEmpty(movies.slice(0, 12), "No titles yet — add some to data/movies.json.")}
    </section>
  </main>`;

  return pageShell({ title: `${SITE_NAME} — ${SITE_TAGLINE}`, body, movies, activeType: "home" });
}

// ---------- Movie detail page ----------
function renderMovie(m, movies) {
  const embedUrl = `https://archive.org/embed/${m.identifier}`;
  const detailsUrl = `https://archive.org/details/${m.identifier}`;
  const downloadUrl = `https://archive.org/download/${m.identifier}`;

  const body = `<main class="detail">
    <span class="badge">${m.genre.join(" / ") || m.type}</span>
    <h1>${m.title}</h1>
    <p class="meta-row">${m.year || ""} &middot; Directed by ${m.director} &middot; ${m.runtime_minutes ? m.runtime_minutes + " min" : ""} &middot; ${m.language}</p>
    <div class="player"><iframe src="${embedUrl}" allowfullscreen></iframe></div>
    <p class="desc">${m.description || ""}</p>
    <div class="actions">
      <a class="btn" href="${downloadUrl}" target="_blank" rel="noopener">Download on Archive.org</a>
      <a class="btn secondary" href="${detailsUrl}" target="_blank" rel="noopener">View source page</a>
    </div>
    <p class="source-note">Hosted and streamed directly from the Internet Archive (archive.org), identifier: <code>${m.identifier}</code>. This title is in the public domain or released under an open license — verify status on the source page before relying on it for redistribution.</p>
  </main>`;

  return pageShell({
    title: `${m.title} (${m.year || ""}) — ${SITE_NAME}`,
    body, movies,
    crumbs: `<a href="/">Home</a> / ${m.title}`,
    activeType: m.type
  });
}

// ---------- Generic listing page (type / genre / language / collection) ----------
function renderListing({ heading, sub, list, movies, activeType }) {
  const body = `<main>
    <h2 class="section-heading">${heading}</h2>
    ${sub ? `<p class="section-sub">${sub}</p>` : ""}
    ${movieGridOrEmpty(list, "No titles here yet — check back soon, or add matching entries to data/movies.json.")}
  </main>`;
  return pageShell({ title: `${heading} — ${SITE_NAME}`, body, movies, activeType, crumbs: `<a href="/">Home</a> / ${heading}` });
}

// ---------- Contact page ----------
function renderContact(movies) {
  const body = `<main>
    <h2 class="section-heading">Contact</h2>
    <div class="contact-box">
      <p>Questions, requests, or a takedown concern about a title? Reach out and we'll get back to you.</p>
      <p>Email: <a href="mailto:inazira.official@gmail.com">inazira.official@gmail.com</a></p>
    </div>
  </main>`;
  return pageShell({ title: `Contact — ${SITE_NAME}`, body, movies, crumbs: `<a href="/">Home</a> / Contact` });
}

// ---------- Write files ----------
fs.rmSync(OUT_DIR, { recursive: true, force: true });
fs.mkdirSync(OUT_DIR, { recursive: true });

function write(relPath, html) {
  const dir = path.join(OUT_DIR, relPath);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "index.html"), html);
}

// Home
write("", renderHome(movies));

// Movie detail pages
for (const m of movies) write(`movies/${slugify(m.title)}`, renderMovie(m, movies));

// Top nav type pages (kept off the /movies/ path so they don't collide with movie detail pages)
const TYPE_LABELS = { series: "Movie Series", tvshow: "TV Shows", documentary: "Awards & Documentaries", other: "Others" };
const TYPE_PATHS = { series: "movie-series", tvshow: "tv-shows", documentary: "documentaries", other: "others" };
for (const [type, label] of Object.entries(TYPE_LABELS)) {
  const list = movies.filter(m => m.type === type);
  write(TYPE_PATHS[type], renderListing({ heading: label, list, movies, activeType: type }));
}
// /movies/ index (the nav link) — lists type=movie titles; individual films live at /movies/<slug>/
write("movies", renderListing({ heading: "Movies", list: movies.filter(m => m.type === "movie"), movies, activeType: "movie" }));

// Genre pages
for (const g of uniqueValues(movies, m => m.genre)) {
  write(`genre/${slugify(g)}`, renderListing({
    heading: g, sub: "Genre", list: movies.filter(m => m.genre.includes(g)), movies
  }));
}
for (const g of ["Horror", "Sci-Fi", "Romantic", "Animations", "Cartoons"]) {
  const dir = `genre/${slugify(g)}`;
  if (!fs.existsSync(path.join(OUT_DIR, dir))) {
    write(dir, renderListing({ heading: g, sub: "Genre", list: movies.filter(m => m.genre.includes(g)), movies }));
  }
}

// Language pages
for (const l of uniqueValues(movies, m => [m.language])) {
  write(`language/${slugify(l)}`, renderListing({
    heading: l, sub: "Language", list: movies.filter(m => m.language === l), movies
  }));
}
for (const l of ["English", "Hindi", "Korean", "Bengali", "Other Languages"]) {
  const dir = `language/${slugify(l)}`;
  if (!fs.existsSync(path.join(OUT_DIR, dir))) {
    write(dir, renderListing({ heading: l, sub: "Language", list: movies.filter(m => m.language === l), movies }));
  }
}

// Collection pages
for (const c of uniqueValues(movies, m => m.collections)) {
  write(`collection/${slugify(c)}`, renderListing({
    heading: c, sub: "Collection", list: movies.filter(m => (m.collections || []).includes(c)), movies
  }));
}
for (const c of ["Charlie Chaplin", "Mr Bean", "James Bond", "Sherlock Holmes", "Animations", "Cartoons", "IMDb Top Movies"]) {
  const dir = `collection/${slugify(c)}`;
  if (!fs.existsSync(path.join(OUT_DIR, dir))) {
    write(dir, renderListing({ heading: c, sub: "Collection", list: movies.filter(m => (m.collections || []).includes(c)), movies }));
  }
}

// Animations & Cartoons combined nav page (covers Animations, Cartoons, and the existing Animation genre tag)
const ANIM_TAGS = ["Animations", "Cartoons", "Animation"];
write("animations-cartoons", renderListing({
  heading: "Animations & Cartoons",
  list: movies.filter(m => m.genre.some(g => ANIM_TAGS.includes(g))),
  movies,
  activeType: "animations"
}));

// Contact
write("contact", renderContact(movies));

// CNAME for GitHub Pages custom subdomain
fs.writeFileSync(path.join(OUT_DIR, "CNAME"), "moviecollections.inazira.com\n");

console.log(`Built ${movies.length} movie pages + nav/genre/language/collection pages into /dist`);
