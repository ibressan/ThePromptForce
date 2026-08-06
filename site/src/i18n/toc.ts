import GithubSlugger from 'github-slugger';

export interface TocItem {
  level: number;
  text: string;
  slug: string;
}

// Mirrors what rehype-slug assigns to each heading, in document order, so
// these links land on the exact same ids react-markdown renders.
export const extractToc = (markdown: string): TocItem[] => {
  const slugger = new GithubSlugger();
  const items: TocItem[] = [];
  const headingRegex = /^(#{3,4})\s+(.+)$/gm;
  let match;
  while ((match = headingRegex.exec(markdown)) !== null) {
    const text = match[2].trim();
    items.push({
      level: match[1].length,
      text,
      slug: slugger.slug(text),
    });
  }
  return items;
};
