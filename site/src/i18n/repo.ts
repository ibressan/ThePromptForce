export const REPO = 'ibressan/ThePromptForce';

/**
 * News/blog content used to be fetched live from raw.githubusercontent.com
 * (this repo was a monorepo holding both site and content, public). Content
 * now lives in two separate PRIVATE repos (ThePromptForce-News,
 * ThePromptForce-Blog), so it can't be fetched client-side anymore — a
 * browser can't hold the token needed to read a private repo. Instead, the
 * site's build step (.github/workflows/pages.yml) pulls the latest content
 * from both repos and copies it into site/public/content/ before `vite
 * build` runs, so it ships as regular static files alongside the site.
 * CONTENT_BASE just points at that bundled, same-origin location.
 */
export const CONTENT_BASE = `${import.meta.env.BASE_URL}content/`;
