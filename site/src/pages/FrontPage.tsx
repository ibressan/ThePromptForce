import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { useLanguage } from '../i18n/LanguageContext';
import { CATEGORIES } from '../i18n/categories';
import {
  splitEditionByLanguage,
  extractCoverImage,
  extractLeadParagraph,
  extractCategorySection,
  estimateReadMinutes,
  extractSources,
  buildEditionTitle,
} from '../i18n/newsMarkdown';
import { fetchAllEditions } from '../i18n/fetchEditions';

interface Edition {
  date: string;
  title: string;
  excerpt: string;
  cover?: string;
  tags: string[];
  readMinutes: number;
  sources: string[];
  publishedAt: Date;
}

const formatDate = (d: Date, language: string) =>
  d.toLocaleDateString(language === 'pt' ? 'pt-BR' : 'en-US', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

const FrontPage = () => {
  const { language, t } = useLanguage();
  const [rawEditions, setRawEditions] = useState<
    { date: string; rawContent: string }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchEditions = async () => {
      try {
        setRawEditions(await fetchAllEditions());
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchEditions();
  }, []);

  const editions: Edition[] = rawEditions.map(({ date, rawContent }) => {
    const { body } = splitEditionByLanguage(rawContent, language);
    const tags = CATEGORIES.filter(
      (c) => extractCategorySection(body, c.label).length > 0,
    ).map((c) => c.label);
    return {
      date,
      title: buildEditionTitle(date, language, t),
      excerpt: extractLeadParagraph(body),
      cover: extractCoverImage(rawContent),
      tags,
      readMinutes: estimateReadMinutes(body),
      sources: extractSources(body),
      publishedAt: new Date(date),
    };
  });

  const [lead, ...rest] = editions;
  const total = editions.length;

  return (
    <Layout>
      <div className="mb-10">
        <div className="flex items-center gap-2 mb-4">
          <span className="status-dot" />
          <span className="tag-number">SALESFORCE NEWS</span>
        </div>
        <div className="font-mono text-xs text-[var(--accent)] mb-2">
          {language === 'pt'
            ? '// Resumo editorial do ecossistema Salesforce'
            : '// Editorial digest of the Salesforce ecosystem'}
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold leading-tight">
          {language === 'pt' ? (
            <>
              O que importa no <span className="text-[var(--accent)]">Salesforce</span>{' '}
              esta semana.
            </>
          ) : (
            <>
              What matters in <span className="text-[var(--accent)]">Salesforce</span>{' '}
              this week.
            </>
          )}
        </h1>
      </div>

      {loading && <p className="text-[var(--ink-soft)]">{t('loading')}</p>}
      {!loading && error && (
        <p className="text-[var(--ink-soft)]">{t('editionLoadError')}</p>
      )}
      {!loading && !error && editions.length === 0 && (
        <p className="text-[var(--ink-soft)]">{t('noEditions')}</p>
      )}

      {lead && (
        <Link
          to={`/edition/${lead.date}`}
          className="group grid sm:grid-cols-[1fr_auto] gap-6 surface-card surface-card-translucent p-5 sm:p-6 mb-10 transition-colors"
        >
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              {lead.tags.map((tag) => (
                <span key={tag} className="tag-pill">
                  #{tag}
                </span>
              ))}
            </div>
            <h2 className="text-xl sm:text-2xl font-bold leading-snug group-hover:text-[var(--accent)]">
              {lead.title}
            </h2>
            <p className="font-serif-body mt-3 text-[var(--ink-soft)] leading-relaxed">
              {lead.excerpt}
            </p>
            <div className="mt-4 font-mono text-xs text-[var(--ink-soft)] flex flex-wrap items-center gap-2">
              <span>{formatDate(lead.publishedAt, language)}</span>
              <span>·</span>
              <span>{lead.readMinutes} min</span>
              {lead.sources.length > 0 && (
                <>
                  <span>·</span>
                  <span>via {lead.sources.slice(0, 2).join(', ')}</span>
                </>
              )}
            </div>
          </div>
          <div className="hidden sm:flex items-start justify-end">
            <span className="font-mono text-4xl text-[var(--line)] group-hover:text-[var(--accent)] transition-colors">
              {String(total).padStart(2, '0')}
            </span>
          </div>
        </Link>
      )}

      {rest.length > 0 && (
        <>
          <div className="rule mb-6" />
          <div className="tag-number mb-4">{t('allEditions').toUpperCase()}</div>
          <div className="space-y-6">
            {rest.map((edition, index) => (
              <Link
                key={edition.date}
                to={`/edition/${edition.date}`}
                className="group grid sm:grid-cols-[1fr_auto] gap-6 surface-card surface-card-translucent p-5 transition-colors"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    {edition.tags.map((tag) => (
                      <span key={tag} className="tag-pill">
                        #{tag}
                      </span>
                    ))}
                  </div>
                  <h3 className="text-lg font-bold leading-snug group-hover:text-[var(--accent)]">
                    {edition.title}
                  </h3>
                  <p className="font-serif-body mt-2 text-sm text-[var(--ink-soft)] leading-relaxed">
                    {edition.excerpt}
                  </p>
                  <div className="mt-3 font-mono text-xs text-[var(--ink-soft)] flex flex-wrap items-center gap-2">
                    <span>{formatDate(edition.publishedAt, language)}</span>
                    <span>·</span>
                    <span>{edition.readMinutes} min</span>
                  </div>
                </div>
                <div className="hidden sm:flex items-start justify-end">
                  <span className="font-mono text-2xl text-[var(--line)] group-hover:text-[var(--accent)] transition-colors">
                    {String(total - index - 1).padStart(2, '0')}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </Layout>
  );
};

export default FrontPage;
