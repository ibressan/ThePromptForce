import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { formatDistance } from 'date-fns';
import { ptBR, enUS } from 'date-fns/locale';
import { useLanguage } from '../i18n/LanguageContext';
import {
  splitEditionByLanguage,
  extractCoverImage,
  extractLeadParagraph,
  stripMarkdown,
} from '../i18n/newsMarkdown';

const REPO = 'ibressan/salesforce-news';
const EDITIONS_PATH = 'editions';

interface GitHubContentEntry {
  name: string;
  download_url: string;
}

interface Edition {
  date: string;
  title: string;
  excerpt: string;
  cover?: string;
  publishedAt: Date;
}

const FrontPage = () => {
  const { language, setLanguage, t } = useLanguage();
  const [rawEditions, setRawEditions] = useState<
    { date: string; rawContent: string }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchEditions = async () => {
      try {
        const res = await fetch(
          `https://api.github.com/repos/${REPO}/contents/${EDITIONS_PATH}`,
        );
        const files: GitHubContentEntry[] = await res.json();

        const mdFiles = files
          .filter((f) => f.name.endsWith('.md'))
          .sort((a, b) => b.name.localeCompare(a.name));

        const parsed = await Promise.all(
          mdFiles.map(async (file) => {
            const date = file.name.replace('.md', '');
            const contentRes = await fetch(file.download_url);
            const rawContent = await contentRes.text();
            return { date, rawContent };
          }),
        );

        setRawEditions(parsed);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchEditions();
  }, []);

  const editions: Edition[] = rawEditions.map(({ date, rawContent }) => {
    const { title, body } = splitEditionByLanguage(rawContent, language);
    return {
      date,
      title: stripMarkdown(title),
      excerpt: extractLeadParagraph(body),
      cover: extractCoverImage(rawContent),
      publishedAt: new Date(date),
    };
  });

  const [lead, ...rest] = editions;
  const dateLocale = language === 'pt' ? ptBR : enUS;

  return (
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs uppercase tracking-widest opacity-60">
            {new Date().toLocaleDateString(language === 'pt' ? 'pt-BR' : 'en-US', {
              day: '2-digit',
              month: 'long',
              year: 'numeric',
            })}
          </div>
          <div className="flex">
            <button
              className={`lang-toggle-btn ${language === 'pt' ? 'active' : ''}`}
              onClick={() => setLanguage('pt')}
              aria-label="Português"
            >
              🇧🇷 PT
            </button>
            <button
              className={`lang-toggle-btn ${language === 'en' ? 'active' : ''}`}
              onClick={() => setLanguage('en')}
              aria-label="English"
            >
              🇺🇸 EN
            </button>
          </div>
        </div>

        <div className="text-center rule-thin border-t-0 pb-4 mb-1">
          <div className="masthead-title text-5xl sm:text-6xl uppercase tracking-tight">
            Salesforce News
          </div>
          <div className="text-xs sm:text-sm uppercase tracking-[0.3em] opacity-60 mt-2">
            {language === 'pt'
              ? 'Resumo editorial do ecossistema Salesforce'
              : 'Editorial digest of the Salesforce ecosystem'}
          </div>
        </div>
        <div className="rule mb-10" />

        {loading && <p className="text-center opacity-70">{t('loading')}</p>}
        {!loading && error && (
          <p className="text-center opacity-70">{t('editionLoadError')}</p>
        )}
        {!loading && !error && editions.length === 0 && (
          <p className="text-center opacity-70">{t('noEditions')}</p>
        )}

        {lead && (
          <Link to={`/edition/${lead.date}`} className="block group mb-10">
            {lead.cover && (
              <img
                src={lead.cover}
                alt={lead.title}
                className="w-full h-64 sm:h-80 object-cover mb-4 grayscale-[15%]"
              />
            )}
            <div className="text-xs uppercase tracking-widest opacity-60 mb-2">
              {t('latestEdition')} ·{' '}
              {formatDistance(lead.publishedAt, new Date(), {
                addSuffix: true,
                locale: dateLocale,
              })}
            </div>
            <h1 className="masthead-title text-3xl sm:text-4xl leading-tight group-hover:underline">
              {lead.title}
            </h1>
            <p className="mt-3 text-base sm:text-lg leading-relaxed">
              {lead.excerpt}
            </p>
            <div className="mt-2 text-sm link-underline font-semibold">
              {t('readFullEdition')} →
            </div>
          </Link>
        )}

        {rest.length > 0 && (
          <>
            <div className="rule mb-6" />
            <div className="text-xs uppercase tracking-widest opacity-60 mb-4">
              {t('allEditions')}
            </div>
            <div className="grid sm:grid-cols-2 gap-8">
              {rest.map((edition) => (
                <Link
                  key={edition.date}
                  to={`/edition/${edition.date}`}
                  className="block group"
                >
                  {edition.cover && (
                    <img
                      src={edition.cover}
                      alt={edition.title}
                      className="w-full h-36 object-cover mb-2 grayscale-[15%]"
                    />
                  )}
                  <div className="text-xs uppercase tracking-widest opacity-60 mb-1">
                    {formatDistance(edition.publishedAt, new Date(), {
                      addSuffix: true,
                      locale: dateLocale,
                    })}
                  </div>
                  <h2 className="masthead-title text-xl leading-snug group-hover:underline">
                    {edition.title}
                  </h2>
                  <p className="mt-1 text-sm leading-relaxed opacity-80">
                    {edition.excerpt}
                  </p>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default FrontPage;
