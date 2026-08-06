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
      <Link to="/" className="link-underline text-sm inline-block mb-6">
        ← {t('backToFrontPage')}
      </Link>

      {error && <p className="opacity-70">{t('editionLoadError')}</p>}

      {!error && content === null && <p className="opacity-70">{t('loading')}</p>}

      {!error && content !== null && toc.length > 0 && (
        <nav className="not-prose paper-card mb-8 p-5">
          <div className="font-semibold text-sm opacity-70 mb-2">
            {t('inThisEdition')}
          </div>
          <ul className="text-sm space-y-1">
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
        </nav>
      )}

      {!error && content !== null && (
        <article className="prose max-w-none">
          <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSlug]}>
            {content}
          </ReactMarkdown>
        </article>
      )}
    </Layout>
  );
};

export default EditionPage;
