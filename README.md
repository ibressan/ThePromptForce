# 🤖 The Prompt Force

Code for the [The Prompt Force](https://ibressan.github.io/ThePromptForce/) site
(React + Vite, deployed to GitHub Pages) — a mix of AI-generated Salesforce news and a
blog about AI, automation and development.

This repo holds **only the site's code** (`site/`). The actual content lives in two
private, separate repos, pulled in at build time:

- [`ibressan/ThePromptForce-News`](https://github.com/ibressan/ThePromptForce-News) —
  weekly Salesforce news digest + the Gemini generation pipeline.
- [`ibressan/ThePromptForce-Blog`](https://github.com/ibressan/ThePromptForce-Blog) —
  blog posts (published manually for now).

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)

## How it deploys

`.github/workflows/pages.yml` builds and deploys the site on every push to `main`
(under `site/**`) **and** whenever either content repo notifies this one via
`repository_dispatch` (each has its own workflow that fires on publish). The build
step pulls the latest `editions/` and `blog/` content from those two repos using a
shared fine-grained PAT (`CROSS_REPO_TOKEN` secret — Contents: read/write on all three
repos) before running `vite build`, so the deployed site is fully static and the
content repos' privacy is never exposed to visitors.

## Local development

`site/public/content/` is populated by the CI step above, not checked into git (see
`site/.gitignore`). Running `npm run dev` locally with an empty `content/` folder means
the front page has nothing to show. To develop against real data, clone the two content
repos somewhere and symlink (or copy) their content folders in:

```bash
mkdir -p site/public/content/news site/public/content/blog
cp -R /path/to/ThePromptForce-News/editions site/public/content/news/
cp /path/to/ThePromptForce-News/sources.json site/public/content/news/
cp /path/to/ThePromptForce-Blog/blog/index.json site/public/content/blog/
cp /path/to/ThePromptForce-Blog/blog/*.md site/public/content/blog/ 2>/dev/null || true
```
