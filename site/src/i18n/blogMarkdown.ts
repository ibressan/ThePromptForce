export interface BlogFrontmatter {
  title: string;
  date: string;
  author: 'cappy' | 'shel';
  category: string;
  cover?: string;
  excerpt?: string;
}

export interface ParsedBlogPost {
  frontmatter: BlogFrontmatter;
  body: string;
}

const FRONTMATTER_BLOCK = /^---\n([\s\S]*?)\n---\n*([\s\S]*)$/;

/**
 * Blog posts use simple flat YAML frontmatter (key: value, no nesting) —
 * a full YAML parser is overkill for this shape, so this just splits lines
 * and strips optional quotes from values.
 */
export const parseBlogPost = (raw: string): ParsedBlogPost => {
  const match = raw.match(FRONTMATTER_BLOCK);
  if (!match) {
    throw new Error('Blog post is missing frontmatter (--- ... ---) block');
  }

  const [, frontmatterBlock, body] = match;
  const fields: Record<string, string> = {};
  for (const line of frontmatterBlock.split('\n')) {
    const fieldMatch = line.match(/^([a-zA-Z]+):\s*(.*)$/);
    if (!fieldMatch) continue;
    const [, key, rawValue] = fieldMatch;
    fields[key] = rawValue.trim().replace(/^"(.*)"$/, '$1');
  }

  if (!fields.title || !fields.date) {
    throw new Error('Blog post frontmatter is missing required fields (title, date)');
  }

  return {
    frontmatter: {
      title: fields.title,
      date: fields.date,
      author: fields.author === 'cappy' ? 'cappy' : 'shel',
      category: fields.category ?? '',
      cover: fields.cover || undefined,
      excerpt: fields.excerpt || undefined,
    },
    body: body.trim(),
  };
};

/** Falls back to the first paragraph of the body when no excerpt is set. */
export const blogExcerpt = (post: ParsedBlogPost): string => {
  if (post.frontmatter.excerpt) return post.frontmatter.excerpt;
  const firstParagraph = post.body.split(/\n\s*\n/)[0] ?? '';
  return firstParagraph
    .replace(/[#*_`]/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .trim();
};
