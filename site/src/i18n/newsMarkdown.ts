import { Language } from './strings';

const PT_HEADER = /^##\s+🇧🇷.*$/m;
const EN_HEADER = /^##\s+🇺🇸.*$/m;

interface SplitEdition {
  title: string;
  body: string;
}

/**
 * Editions are authored as a single bilingual markdown file with a
 * "## 🇧🇷 Português" section followed by a "## 🇺🇸 English" section.
 * This extracts only the section matching the given language.
 */
export const splitEditionByLanguage = (
  content: string,
  language: Language,
): SplitEdition => {
  const titleLine = content.match(/^#\s+(.+)$/m)?.[1] ?? '';
  const [ptTitle, enTitle] = titleLine.split(/\s*\/\s*/);
  const title = language === 'en' ? enTitle || titleLine : ptTitle || titleLine;

  const ptStart = content.search(PT_HEADER);
  const enStart = content.search(EN_HEADER);

  let body = content;
  if (ptStart !== -1 && enStart !== -1) {
    body =
      language === 'pt'
        ? content.slice(ptStart, enStart)
        : content.slice(enStart);
    // Drops the "## 🇧🇷 Português" / "## 🇺🇸 English" header line itself,
    // since the caller already renders its own title above the body.
    body = body.replace(/^##\s+.*$\n*/, '');
  }

  return { title, body: body.trim() };
};

export const stripMarkdown = (text: string): string =>
  text
    .replace(/\*\*/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[📅🔗🚀💡📖🇧🇷🇺🇸]/gu, '')
    .trim();

/**
 * Extracts the edition's cover image URL from the leading ![Cover](url) line,
 * if present.
 */
export const extractCoverImage = (rawContent: string): string | undefined => {
  const match = rawContent.match(/^!\[Cover\]\((.+)\)/m);
  return match ? match[1] : undefined;
};

/**
 * Technical News items are editorial paragraphs (no leading "- "), so the
 * excerpt is the first paragraph after that section's heading — usually the
 * lead-in framing the week, which reads well as a teaser.
 */
export const extractLeadParagraph = (body: string): string => {
  const match = body.match(/###\s*🚀[^\n]*\n+([^\n]+(?:\n(?!\n|#)[^\n]+)*)/);
  return match ? stripMarkdown(match[1]) : '';
};

/**
 * Extracts the content under a "#### {label}" topic heading (e.g. "Apex",
 * "Data Cloud"), up to the next heading of level 2-4 or the end of the body.
 * Used to build the per-category pages without needing separate files per
 * topic — the source edition already groups items this way.
 */
export const extractCategorySection = (
  body: string,
  label: string,
): string => {
  const pattern = new RegExp(
    `####\\s*${label}[^\\n]*\\n+([\\s\\S]*?)(?=\\n#{2,4}\\s|$)`,
  );
  const match = body.match(pattern);
  return match ? match[1].trim() : '';
};

/** Rough reading-time estimate (~200 words/min), minimum 1 minute. */
export const estimateReadMinutes = (text: string): number => {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
};

const SOURCE_NAMES: Record<string, string> = {
  'salesforceben.com': 'Salesforce Ben',
  'apexhours.com': 'Apex Hours',
  'salesforce.com': 'Salesforce Blog',
  'sfdcstop.blogspot.com': 'SFDC Stop',
  'automationchampion.com': 'Automation Champion',
  'developer.salesforce.com': 'Salesforce Developer Blog',
  'admin.salesforce.com': 'Salesforce Admins',
};

/** Extracts the friendly names of the sources linked in the body (dedup, in
 * first-seen order), for the "via X, Y" byline. */
export const extractSources = (body: string): string[] => {
  const seen = new Set<string>();
  const names: string[] = [];
  const linkRegex = /\[[^\]]+\]\((https?:\/\/[^)]+)\)/g;
  let match;
  while ((match = linkRegex.exec(body)) !== null) {
    try {
      const host = new URL(match[1]).hostname.replace(/^www\./, '');
      const name = SOURCE_NAMES[host] ?? host;
      if (!seen.has(name)) {
        seen.add(name);
        names.push(name);
      }
    } catch {
      // ignore malformed URLs
    }
  }
  return names;
};
