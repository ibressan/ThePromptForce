export interface FeedItem {
  type: 'news' | 'blog';
  date: string;
  title: string;
  excerpt: string;
  cover?: string;
  tags: string[];
  author: 'cappy' | 'shel';
  href: string;
  readMinutes: number;
  sources?: string[];
}

/** URL-safe slug for a free-text blog category, e.g. "IA & Automação" -> "ia-automacao". */
export const slugifyCategory = (category: string): string =>
  category
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

export const mergeAndSortFeed = (items: FeedItem[]): FeedItem[] =>
  [...items].sort((a, b) => b.date.localeCompare(a.date));
