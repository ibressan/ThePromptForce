import { CONTENT_BASE } from './repo';

const RAW_BASE = `${CONTENT_BASE}news/editions/`;

interface RawEdition {
  date: string;
  rawContent: string;
}

/**
 * Lists and fetches every edition's raw markdown, newest first, from the
 * site's own bundled content (see repo.ts for why this isn't a live
 * cross-repo fetch anymore — the content repo is private).
 */
export const fetchAllEditions = async (): Promise<RawEdition[]> => {
  const indexRes = await fetch(`${RAW_BASE}index.json`);
  if (!indexRes.ok) throw new Error('Could not load editions index');
  const { editions: dates }: { editions: string[] } = await indexRes.json();

  return Promise.all(
    dates.map(async (date) => {
      const contentRes = await fetch(`${RAW_BASE}${date}.md`);
      const rawContent = await contentRes.text();
      return { date, rawContent };
    }),
  );
};
