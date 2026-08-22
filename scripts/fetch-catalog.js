// scripts/fetch-catalog.js
// Pulls feature-film metadata from the Internet Archive Advanced Search API
// and writes it into data/movies.json in the shape build.js expects.
//
// Run locally (this sandbox can't reach archive.org):
//   node scripts/fetch-catalog.js
//
// Edit QUERY / ROWS below to change what gets pulled. Always spot-check
// a few results on https://archive.org/details/<identifier> before
// publishing — see the "verification" note in README.md.

const fs = require("fs");
const path = require("path");

const QUERY = 'collection:feature_films AND mediatype:movies';
const ROWS = 40;
const FIELDS = ["identifier", "title", "year", "description", "creator"];

const fieldsParam = FIELDS.map(f => `fl[]=${encodeURIComponent(f)}`).join("&");
const url = `https://archive.org/advancedsearch.php?q=${encodeURIComponent(QUERY)}&${fieldsParam}&sort[]=downloads+desc&rows=${ROWS}&output=json`;

async function main() {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Archive.org request failed: ${res.status}`);
  const data = await res.json();
  const docs = data.response?.docs || [];

  const movies = docs
    .filter(d => d.identifier && d.title)
    .map(d => ({
      identifier: d.identifier,
      title: Array.isArray(d.title) ? d.title[0] : d.title,
      year: Number(d.year) || null,
      genre: [],
      director: Array.isArray(d.creator) ? d.creator[0] : (d.creator || "Unknown"),
      description: (Array.isArray(d.description) ? d.description[0] : d.description || "")
        .replace(/<[^>]+>/g, "")
        .slice(0, 400),
      runtime_minutes: null
    }));

  const outPath = path.join(__dirname, "..", "data", "movies.json");
  fs.writeFileSync(outPath, JSON.stringify(movies, null, 2));
  console.log(`Wrote ${movies.length} titles to ${outPath}`);
  console.log("Next: open data/movies.json and fill in genre/runtime, and spot-check identifiers on archive.org before publishing.");
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
