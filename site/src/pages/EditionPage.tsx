import { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSlug from 'rehype-slug';
import Layout from '../components/Layout';
import { useLanguage } from '../i18n/LanguageContext';
import {
  splitEditionByLanguage,
  buildEditionTitle,
  estimateReadMinutes,
} from '../i18n/newsMarkdown';
import { extractToc } from '../i18n/toc';
import ShareButtons from '../components/ShareButtons';

import { CONTENT_BASE } from '../i18n/repo';

const RAW_BASE = `${CONTENT_BASE}news/editions/`;

const EditionPage = () => {
  const { date } = useParams<{ date: string }>();
  const { language, t } = useLanguage();
  const [rawContent, setRawContent] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!date) return;

    setRawContent(null);
    setError(false);

    fetch(`${RAW_BASE}${date}.md`)
      .then((res) => {
        if (!res.ok) throw new Error('Not found');
        return res.text();
      })
      .then((text) => {
        // Resolves relative image paths against the raw GitHub folder,
        // since this page isn't served from there.
        const resolved = text.replace(
          /!\[([^\]]*)\]\((?!https?:\/\/)([^)]+)\)/g,
          (_match, alt, src) => `![${alt}](${RAW_BASE}${src})`,
        );
        setRawContent(resolved);
      })
      .catch(() => setError(true));
  }, [date]);

  const body = useMemo(() => {
    if (rawContent === null) return null;
    return splitEditionByLanguage(rawContent, language).body;
  }, [rawContent, language]);

  const content = useMemo(() => {
    if (body === null || !date) return null;
    const title = buildEditionTitle(date, language, t);
    return `# ${title}\n\n${body}`;
  }, [body, language, date, t]);

  const readMinutes = useMemo(() => (body ? estimateReadMinutes(body) : 0), [body]);

  const toc = useMemo(() => (content ? extractToc(content) : []), [content]);
  const editionTitle = date ? buildEditionTitle(date, language, t) : '';

  return (
    <Layout>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <Link
          to="/news"
          className="link-underline text-sm inline-flex items-baseline gap-1.5"
        >
          <span className="font-mono">←</span> {t('backToFrontPage')}
        </Link>

        {!error && content !== null && (
          <ShareButtons title={editionTitle} url={window.location.href} />
        )}
      </div>

      {!error && content !== null && (
        <div className="flex items-center gap-2.5 mb-8">
          <img
            src="/ThePromptForce/mascote/mascote-about.png"
            alt="Cappy"
            className="w-9 h-9 rounded-full object-cover object-top border border-[var(--line)]"
          />
          <span className="font-mono text-xs text-[var(--ink-soft)]">
            {t('writtenBy').replace('{name}', 'Cappy')} · {readMinutes} min
          </span>
        </div>
      )}

      {error && <p className="text-[var(--ink-soft)]">{t('editionLoadError')}</p>}

      {!error && content === null && (
        <p className="text-[var(--ink-soft)]">{t('loading')}</p>
      )}

      {!error && content !== null && toc.length > 0 && (
        <nav className="not-prose surface-card surface-card-translucent mb-8 p-5 flex items-center gap-6">
          <img
            src="/ThePromptForce/mascote/mascote-toc.png"
            alt=""
            aria-hidden="true"
            className="hidden sm:block shrink-0 w-24 sm:w-28 object-contain"
          />

          <div className="flex-1">
            <div className="tag-number mb-3">{t('inThisEdition').toUpperCase()}</div>
            <ul className="text-sm space-y-1.5">
              {toc.map((item, index) => (
                <li key={index} className={item.level === 4 ? 'ml-4' : 'font-medium'}>
                  <a
                    href={`#${item.slug}`}
                    className="link-underline"
                    onClick={(e) => {
                      // Plain hash navigation would be swallowed by the
                      // app's HashRouter (it treats the URL hash as the
                      // route) — scroll manually instead.
                      e.preventDefault();
                      document
                        .getElementById(item.slug)
                        ?.scrollIntoView({ behavior: 'smooth' });
                    }}
                  >
                    {item.text}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </nav>
      )}

      {!error && content !== null && (
        <div className="surface-card surface-card-translucent p-5 sm:p-8">
          <article className="prose max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSlug]}>
              {content}
            </ReactMarkdown>
          </article>
        </div>
      )}
    </Layout>
  );
};

export default EditionPage;
