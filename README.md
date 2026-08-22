# moviecollections.inazira.com

Static, public-domain film catalog. No server, no database — plain HTML
pages generated from `data/movies.json`, hosted free on GitHub Pages,
video streamed directly from the Internet Archive (so you pay nothing
for bandwidth or storage).

## How it works

- `data/movies.json` — your catalog. One entry per film.
- `build.js` — reads that file and generates a full static site into `dist/`
  (a homepage grid + one page per movie), styled in the INAZIRA brand
  (navy/brass/ivory, Playfair Display headings, fading eyebrow header).
- Each movie page embeds the Archive.org player directly (`archive.org/embed/<identifier>`)
  and links to the official download and source page — you never host
  the actual video file.

## Local setup

```bash
node build.js        # generates dist/
npx serve dist        # preview locally (or just open dist/index.html)
```

## Adding movies

**Option A — by hand:** add an entry to `data/movies.json` following the
existing shape (identifier, title, year, genre, director, description,
runtime_minutes), then re-run `node build.js`.

**Option B — pull from Internet Archive:** run
`node scripts/fetch-catalog.js` (on your own machine — this needs
internet access to archive.org) to pull a batch of feature-film metadata
automatically into `data/movies.json`. You'll still want to fill in
`genre` and `runtime_minutes` by hand afterward, since the API doesn't
return those cleanly.

## ⚠️ Verify before publishing each title

Public-domain status has to be checked per title — don't trust any list
(including the seed data in this repo) blindly:

1. Open `https://archive.org/details/<identifier>` for the film.
2. Confirm the item's rights/license field shows public domain or an
   open license (not just "uploaded by a user" with no rights info).
3. Watch for titles where only a *specific restoration or dub* is
   copyrighted even though the underlying film is PD — prefer
   unrestored/original transfers from reputable uploaders.
4. When in doubt, leave it out — pull it from `data/movies.json` and
   re-run the build.

## Deploying to GitHub Pages (moviecollections.inazira.com)

1. Create a new GitHub repo and push this folder to it (branch `main`).
2. In the repo: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
   The included workflow (`.github/workflows/deploy.yml`) builds and
   deploys automatically on every push to `main`.
3. In the repo: **Settings → Pages → Custom domain** → enter
   `moviecollections.inazira.com` and save. (The `dist/CNAME` file the
   build script generates handles this too, but setting it in the UI
   once is what actually provisions HTTPS.)
4. In your DNS provider for `inazira.com`, add a **CNAME record**:
   - Host: `moviecollections`
   - Value: `<your-github-username>.github.io`
5. Wait for DNS to propagate (usually minutes to a couple hours), then
   GitHub will auto-issue an HTTPS certificate for the subdomain.

## Updating the live site

Just edit `data/movies.json` (by hand or via the fetch script), commit,
and push to `main` — the GitHub Action rebuilds and redeploys
automatically. No manual `node build.js` step needed once this is wired
up, though it's useful for local preview.
