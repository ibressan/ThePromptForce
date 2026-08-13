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
import { fetchAllBlogPosts } from '../i18n/fetchBlogPosts';
import { blogExcerpt } from '../i18n/blogMarkdown';
import { FeedItem, mergeAndSortFeed } from '../i18n/feed';
import { AUTHOR_NAMES } from '../i18n/authors';

type Mode = 'all' | 'news' | 'blog';

const formatDate = (dateStr: string, language: string) =>
  new Date(dateStr).toLocaleDateString(language === 'pt' ? 'pt-BR' : 'en-US', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

const FrontPage = ({ mode }: { mode: Mode }) => {
  const { language, t } = useLanguage();
  const [newsItems, setNewsItems] = useState<FeedItem[]>([]);
  const [blogItems, setBlogItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(false);

    Promise.all([
      fetchAllEditions().catch(() => []),
      fetchAllBlogPosts().catch(() => []),
    ])
      .then(([rawEditions, rawPosts]) => {
        const news: FeedItem[] = rawEditions.map(({ date, rawContent }) => {
          const { body } = splitEditionByLanguage(rawContent, language);
          const tags = CATEGORIES.filter(
            (c) => extractCategorySection(body, c.label).length > 0,
          ).map((c) => c.label);
          return {
            type: 'news',
            date,
            title: buildEditionTitle(date, language, t),
            excerpt: extractLeadParagraph(body),
            cover: extractCoverImage(rawContent),
            tags,
            author: 'cappy',
            href: `/news/edition/${date}`,
            readMinutes: estimateReadMinutes(body),
            sources: extractSources(body),
          };
        });

        const blog: FeedItem[] = rawPosts.map((post) => ({
          type: 'blog',
          date: post.frontmatter.date,
          title: post.frontmatter.title,
          excerpt: blogExcerpt(post),
          cover: post.frontmatter.cover,
          tags: post.frontmatter.category ? [post.frontmatter.category] : [],
          author: post.frontmatter.author,
          href: `/blog/${post.slug}`,
          readMinutes: estimateReadMinutes(post.body),
        }));

        setNewsItems(news);
        setBlogItems(blog);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [language]);

  const feed = mergeAndSortFeed(
    mode === 'news' ? newsItems : mode === 'blog' ? blogItems : [...newsItems, ...blogItems],
  );
  const [lead, ...rest] = feed;
  const total = feed.length;

  const heading =
    mode === 'news'
      ? language === 'pt'
        ? 'NOTÍCIAS'
        : 'NEWS'
      : mode === 'blog'
        ? 'BLOG'
        : 'THE PROMPT FORCE';

  const tagline =
    mode === 'news'
      ? language === 'pt'
        ? '// Resumo editorial do ecossistema Salesforce'
        : '// Editorial digest of the Salesforce ecosystem'
      : mode === 'blog'
        ? language === 'pt'
          ? '// Posts sobre IA, automação e desenvolvimento'
          : '// Posts about AI, automation and development'
        : language === 'pt'
          ? '// Notícias e blog do ecossistema Salesforce e IA'
          : '// News and blog on the Salesforce and AI ecosystem';

  return (
    <Layout>
      <div className="mb-10">
        <div className="flex items-center gap-2 mb-4">
          <span className="status-dot" />
          <span className="tag-number">{heading}</span>
        </div>
        <div className="font-mono text-xs text-[var(--accent)] mb-2">{tagline}</div>
        <h1 className="text-3xl sm:text-4xl font-extrabold leading-tight">
          {language === 'pt' ? (
            <>
              O que importa no <span className="text-[var(--accent)]">Salesforce</span>{' '}
              e em IA esta semana.
            </>
          ) : (
            <>
              What matters in <span className="text-[var(--accent)]">Salesforce</span>{' '}
              and AI this week.
            </>
          )}
        </h1>
      </div>

      {loading && <p className="text-[var(--ink-soft)]">{t('loading')}</p>}
      {!loading && error && (
        <p className="text-[var(--ink-soft)]">{t('editionLoadError')}</p>
      )}
      {!loading && !error && feed.length === 0 && (
        <p className="text-[var(--ink-soft)]">
          {mode === 'blog' ? t('noBlogPosts') : t('noEditions')}
        </p>
      )}

      {lead && (
        <Link
          to={lead.href}
          className="group grid sm:grid-cols-[1fr_auto] gap-6 surface-card surface-card-translucent p-5 sm:p-6 mb-10 transition-colors"
        >
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              {lead.type === 'blog' && (
                <span className="tag-pill">{AUTHOR_NAMES[lead.author]}</span>
              )}
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
              <span>{formatDate(lead.date, language)}</span>
              <span>·</span>
              <span>{lead.readMinutes} min</span>
              {lead.sources && lead.sources.length > 0 && (
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
            {rest.map((item, index) => (
              <Link
                key={item.href}
                to={item.href}
                className="group grid sm:grid-cols-[1fr_auto] gap-6 surface-card surface-card-translucent p-5 transition-colors"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    {item.type === 'blog' && (
                      <span className="tag-pill">{AUTHOR_NAMES[item.author]}</span>
                    )}
                    {item.tags.map((tag) => (
                      <span key={tag} className="tag-pill">
                        #{tag}
                      </span>
                    ))}
                  </div>
                  <h3 className="text-lg font-bold leading-snug group-hover:text-[var(--accent)]">
                    {item.title}
                  </h3>
                  <p className="font-serif-body mt-2 text-sm text-[var(--ink-soft)] leading-relaxed">
                    {item.excerpt}
                  </p>
                  <div className="mt-3 font-mono text-xs text-[var(--ink-soft)] flex flex-wrap items-center gap-2">
                    <span>{formatDate(item.date, language)}</span>
                    <span>·</span>
                    <span>{item.readMinutes} min</span>
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
