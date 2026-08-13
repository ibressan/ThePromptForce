import { RAW_BASE as REPO_RAW_BASE } from './repo';

const RAW_BASE = `${REPO_RAW_BASE}editions/`;

interface RawEdition {
  date: string;
  rawContent: string;
}

/**
 * Lists and fetches every edition's raw markdown, newest first.
 *
 * Deliberately avoids the GitHub Contents API (api.github.com) to list the
 * editions/ folder: that API caps unauthenticated requests at 60/hour per
 * client IP — shared by every visitor behind the same NAT/proxy — and once
 * exhausted the front page stops loading site-wide with no visible cause.
 * editions/index.json (maintained by script.py on each publish) plus plain
 * raw.githubusercontent.com file fetches have no such limit.
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
