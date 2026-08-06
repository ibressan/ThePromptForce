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
