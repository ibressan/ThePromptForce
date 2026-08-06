import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { formatDistance } from 'date-fns';
import { ptBR, enUS } from 'date-fns/locale';
import Layout from '../components/Layout';
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
  const { language, t } = useLanguage();
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
    <Layout>
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
    </Layout>
  );
};

export default FrontPage;
