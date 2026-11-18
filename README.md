# Forever Timeline — React migration

React + Vite frontend for https://wrisov.github.io/forever-timeline/.

## What changes
- Timeline content is loaded from `public/data/memories.json`.
- Approved images are served from `public/images/`.
- The public form sends image submissions to a Cloudflare Worker.
- The Worker commits submissions under `images/pending/` and `submissions/`; they do **not** appear on the public timeline until reviewed and added to the approved memories JSON.
- GitHub Pages is built and deployed by the included Actions workflow.

## Deploy the frontend
1. Merge this PR after reviewing it.
2. In repository Settings → Pages, set the build source to **GitHub Actions**.
3. Add repository Actions variables:
   - `VITE_UPLOAD_API_URL`: deployed Worker origin, e.g. `https://forever-timeline-submissions.<account>.workers.dev`
   - `VITE_TURNSTILE_SITE_KEY`: public Cloudflare Turnstile site key
4. Push/merge to `main`; the workflow builds the Vite app and publishes `dist/`.

## Deploy public submission API
1. Install Wrangler and authenticate with Cloudflare.
2. Create a KV namespace: `wrangler kv namespace create RATE_LIMIT`.
3. Put its returned ID in `worker/wrangler.toml`.
4. Create a Cloudflare Turnstile widget allowing `wrisov.github.io`.
5. From `worker/`, run `wrangler secret put GITHUB_TOKEN` and `wrangler secret put TURNSTILE_SECRET`.
6. The GitHub fine-grained token must be restricted to this repository and have **Contents: Read and write**. Never expose it in frontend variables.
7. Run `wrangler deploy`.

The Worker allows only the configured site origin, verifies Turnstile, caps images at 5 MB, validates image signatures and applies a per-IP hourly limit. Public uploads are still untrusted: review queued files and delete spam submissions.

## Publish a reviewed submission
- Inspect the JSON in `submissions/` and the corresponding file under `images/pending/`.
- If approved, move/copy the image into `public/images/YYYY/MM/` and add a memory record to `public/data/memories.json` using that public image path.
- Delete the pending JSON and pending image in the same review commit.
- Do not publish personal or sensitive images without consent.

## Local development
```bash
npm install
npm run dev
npm run build
```
Uploads require the deployed Worker and Turnstile configuration.