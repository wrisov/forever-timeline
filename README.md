# Forever Timeline

A React + Vite timeline hosted on GitHub Pages.

## How it works

- Timeline entries are stored in `public/data/memories.json`.
- Photos are stored in `public/images/`.
- The website is read-only. There is no public upload form, backend, Cloudflare Worker, or external upload service.
- GitHub Actions builds and deploys the site whenever changes are pushed to `main`.

## Add a memory manually

1. Add your photo(s) to a folder under `public/images/`. A useful convention is `public/images/YYYY/MM/`, for example `public/images/2026/11/`.
2. Open `public/data/memories.json` and add an object to the top-level array:

```json
{
  "id": "first-coffee-together",
  "date": "2026-11-18",
  "title": "Our first coffee together",
  "tagline": "A little moment, kept forever",
  "description": "A short note about the day.",
  "images": [
    "images/2026/11/first-coffee-together.jpg"
  ]
}
```

3. Use a unique `id`, a valid `YYYY-MM-DD` date, and image paths relative to the `public/` directory. If a memory has multiple photos, add multiple paths to the `images` array. Use an empty array when there are no photos.
4. Commit and push the changes to `main`. GitHub Actions will build and publish the updated timeline.

The image path in the JSON is relative to the site's base URL; do not include the `public/` prefix.

## Run locally

Requires Node.js 20 or newer.

```bash
git clone https://github.com/wrisov/forever-timeline.git
cd forever-timeline
npm install
npm run dev
```

Open the local URL printed by Vite (usually `http://localhost:5173/forever-timeline/`).

To test the production build:

```bash
npm run build
npm run preview
```

## Deploy

1. In repository Settings → Pages, choose **GitHub Actions** as the build and deployment source.
2. Push or merge changes to `main`.
3. The workflow installs dependencies, runs `npm run build`, and deploys the generated `dist/` directory.

No Cloudflare account, API token, Worker secrets, CAPTCHA keys, or repository Actions variables are needed.
