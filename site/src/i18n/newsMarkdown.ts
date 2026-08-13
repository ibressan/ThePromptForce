import { Language } from './strings';
import { parseLocalDate } from './date';

const PT_HEADER = /^##\s+🇧🇷.*$/m;
const EN_HEADER = /^##\s+🇺🇸.*$/m;

interface SplitEdition {
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
  const ptStart = content.search(PT_HEADER);
  const enStart = content.search(EN_HEADER);

  let body = content;
  if (ptStart !== -1 && enStart !== -1) {
    body =
      language === 'pt'
        ? content.slice(ptStart, enStart)
        : content.slice(enStart);
    // Drops the "## 🇧🇷 Português" / "## 🇺🇸 English" header line itself,
    // since the caller already renders its own title above the body and the
    // language is already implied by the PT/EN toggle. (".*$" without the
    // multiline flag never matched past the line's newline, so this used to
    // silently leave the flag+language heading in the rendered body.)
    body = body.replace(/^##\s+[^\n]*\n*/, '');
  }

  return { body: body.trim() };
};

/** Localized "DD Mon YYYY" formatting for an edition's date (YYYY-MM-DD). */
export const formatEditionDate = (dateStr: string, language: Language): string =>
  parseLocalDate(dateStr).toLocaleDateString(language === 'pt' ? 'pt-BR' : 'en-US', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

/**
 * Builds the edition title from its date rather than parsing the raw
 * markdown H1 — the generated H1 packed both languages onto one line
 * ("Edição de 2026-08-05 / Weekly Edition — 2026-08-05"), which showed an
 * unlocalized ISO date and a stray em dash regardless of language.
 */
export const buildEditionTitle = (
  dateStr: string,
  language: Language,
  t: (key: string) => string,
): string => t('editionTitle').replace('{date}', formatEditionDate(dateStr, language));

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
  'guilhermedornelas.com.br': 'Radar Salesforce',
  'salesforcecodex.com': 'Salesforce Codex',
  'unofficialsf.com': 'Unofficial SF',
  'metillium.com': 'Metillium',
  'sf9to5.com': 'SF9to5',
  'blogs.mulesoft.com': 'MuleSoft Blog',
  'simplysfdc.com': 'SimplySFDC',
  'salesforcetime.com': 'Salesforce Time',
  'sfdclesson.com': 'SFDC Lessons',
  'salesforcefaqs.com': 'Salesforce FAQs',
  'salesforcediaries.com': 'Salesforce Diaries',
  'sudipta-deb.in': 'Technical Potpourri',
  'jenwlee.com': "Jenwlee's Salesforce Blog",
  'sfdcpanther.com': 'SFDC Panther',
  'salesforcetrail.com': 'Salesforce Trail',
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
