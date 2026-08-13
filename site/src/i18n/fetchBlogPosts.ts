import { RAW_BASE as REPO_RAW_BASE } from './repo';
import { parseBlogPost, ParsedBlogPost } from './blogMarkdown';

const RAW_BASE = `${REPO_RAW_BASE}blog/`;

interface BlogIndexEntry {
  slug: string;
  date: string;
  category: string;
}

export interface RawBlogPost extends ParsedBlogPost {
  slug: string;
}

/**
 * Lists and fetches every blog post, newest first — same pattern as
 * fetchAllEditions: a manifest (blog/index.json) plus plain
 * raw.githubusercontent.com file fetches, to avoid the GitHub Contents
 * API's per-IP rate limit (see fetchEditions.ts for the full story).
 */
export const fetchAllBlogPosts = async (): Promise<RawBlogPost[]> => {
  const indexRes = await fetch(`${RAW_BASE}index.json`);
  if (!indexRes.ok) throw new Error('Could not load blog index');
  const { posts }: { posts: BlogIndexEntry[] } = await indexRes.json();

  const sorted = [...posts].sort((a, b) => b.date.localeCompare(a.date));

  return Promise.all(
    sorted.map(async ({ slug }) => {
      const contentRes = await fetch(`${RAW_BASE}${slug}.md`);
      const raw = await contentRes.text();
      return { slug, ...parseBlogPost(raw) };
    }),
  );
};

/** Lightweight fetch of just the manifest, for building the category submenu
 * without downloading every post body. */
export const fetchBlogCategories = async (): Promise<string[]> => {
  const indexRes = await fetch(`${RAW_BASE}index.json`);
  if (!indexRes.ok) return [];
  const { posts }: { posts: BlogIndexEntry[] } = await indexRes.json();

  const seen = new Set<string>();
  const categories: string[] = [];
  for (const post of posts) {
    if (post.category && !seen.has(post.category)) {
      seen.add(post.category);
      categories.push(post.category);
    }
  }
  return categories;
};
