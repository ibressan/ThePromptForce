import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { formatDistance } from 'date-fns';
import { ptBR, enUS } from 'date-fns/locale';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Layout from '../components/Layout';
import { useLanguage } from '../i18n/LanguageContext';
import { CATEGORIES } from '../i18n/categories';
import { splitEditionByLanguage, extractCategorySection } from '../i18n/newsMarkdown';

const REPO = 'ibressan/salesforce-news';
const EDITIONS_PATH = 'editions';

interface GitHubContentEntry {
  name: string;
  download_url: string;
}

interface CategoryItem {
  date: string;
  content: string;
  publishedAt: Date;
}

const CategoryPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { language, t } = useLanguage();
  const [items, setItems] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const category = CATEGORIES.find((c) => c.slug === slug);

  useEffect(() => {
    if (!category) return;

    setLoading(true);
    setError(false);

    const fetchItems = async () => {
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
            const { body } = splitEditionByLanguage(rawContent, language);
            const content = extractCategorySection(body, category.label);
            return { date, content, publishedAt: new Date(date) };
          }),
        );

        setItems(parsed.filter((item) => item.content));
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, [category, language]);

  const dateLocale = language === 'pt' ? ptBR : enUS;

  if (!category) {
    return (
      <Layout>
        <p className="opacity-70">{t('editionLoadError')}</p>
      </Layout>
    );
  }

  return (
    <Layout>
      <h1 className="masthead-title text-3xl sm:text-4xl mb-8">
        {category.label}
      </h1>

      {loading && <p className="opacity-70">{t('loading')}</p>}
      {!loading && error && <p className="opacity-70">{t('editionLoadError')}</p>}
      {!loading && !error && items.length === 0 && (
        <p className="opacity-70">{t('noCategoryItems')}</p>
      )}

      <div className="space-y-8">
        {items.map((item) => (
          <div key={item.date} className="rule-thin border-t-0 pt-6 first:pt-0 first:border-0">
            <div className="text-xs uppercase tracking-widest opacity-60 mb-2">
              {formatDistance(item.publishedAt, new Date(), {
                addSuffix: true,
                locale: dateLocale,
              })}
            </div>
            <div className="prose max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {item.content}
              </ReactMarkdown>
            </div>
            <Link
              to={`/edition/${item.date}`}
              className="link-underline text-sm font-semibold"
            >
              {t('readMore')}
            </Link>
          </div>
        ))}
      </div>
    </Layout>
  );
};

export default CategoryPage;
