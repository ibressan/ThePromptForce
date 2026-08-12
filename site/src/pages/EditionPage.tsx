import { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSlug from 'rehype-slug';
import Layout from '../components/Layout';
import { useLanguage } from '../i18n/LanguageContext';
import { splitEditionByLanguage } from '../i18n/newsMarkdown';
import { extractToc } from '../i18n/toc';

const REPO = 'ibressan/salesforce-news';
const RAW_BASE = `https://raw.githubusercontent.com/${REPO}/main/editions/`;

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

  const content = useMemo(() => {
    if (rawContent === null) return null;
    const { title, body } = splitEditionByLanguage(rawContent, language);
    return `# ${title}\n\n${body}`;
  }, [rawContent, language]);

  const toc = useMemo(() => (content ? extractToc(content) : []), [content]);

  return (
    <Layout>
      <Link
        to="/"
        className="link-underline text-sm inline-flex items-baseline gap-1.5 mb-8"
      >
        <span className="font-mono">←</span> {t('backToFrontPage')}
      </Link>

      {error && <p className="text-[var(--ink-soft)]">{t('editionLoadError')}</p>}

      {!error && content === null && (
        <p className="text-[var(--ink-soft)]">{t('loading')}</p>
      )}

      {!error && content !== null && toc.length > 0 && (
        <nav className="not-prose surface-card surface-card-translucent mb-8 p-5 flex items-center gap-6">
          <img
            src="/salesforce-news/mascote/mascote-toc.png"
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
