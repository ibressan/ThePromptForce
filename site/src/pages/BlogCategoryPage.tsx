import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { formatDistance } from 'date-fns';
import { ptBR, enUS } from 'date-fns/locale';
import Layout from '../components/Layout';
import { useLanguage } from '../i18n/LanguageContext';
import { fetchAllBlogPosts, RawBlogPost } from '../i18n/fetchBlogPosts';
import { blogExcerpt } from '../i18n/blogMarkdown';
import { slugifyCategory } from '../i18n/feed';
import { AUTHOR_NAMES } from '../i18n/authors';

const BlogCategoryPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { language, t } = useLanguage();
  const [posts, setPosts] = useState<RawBlogPost[]>([]);
  const [category, setCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(false);

    fetchAllBlogPosts()
      .then((all) => {
        const matching = all.filter(
          (post) => slugifyCategory(post.frontmatter.category) === slug,
        );
        setPosts(matching);
        setCategory(matching[0]?.frontmatter.category ?? null);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [slug]);

  const dateLocale = language === 'pt' ? ptBR : enUS;

  return (
    <Layout>
      {category && <div className="tag-pill inline-block mb-3">#{category}</div>}
      <h1 className="text-3xl sm:text-4xl font-extrabold mb-8">
        {category ?? '...'}
      </h1>

      {loading && <p className="text-[var(--ink-soft)]">{t('loading')}</p>}
      {!loading && error && (
        <p className="text-[var(--ink-soft)]">{t('blogLoadError')}</p>
      )}
      {!loading && !error && posts.length === 0 && (
        <p className="text-[var(--ink-soft)]">{t('noBlogPosts')}</p>
      )}

      <div className="space-y-6">
        {posts.map((post) => (
          <div
            key={post.slug}
            className="surface-card surface-card-translucent p-5"
          >
            <div className="flex items-center gap-2 font-mono text-xs text-[var(--ink-soft)] mb-2">
              <span>{AUTHOR_NAMES[post.frontmatter.author]}</span>
              <span>·</span>
              <span>
                {formatDistance(new Date(post.frontmatter.date), new Date(), {
                  addSuffix: true,
                  locale: dateLocale,
                })}
              </span>
            </div>
            <h2 className="text-xl font-bold mb-2">{post.frontmatter.title}</h2>
            <p className="font-serif-body text-[var(--ink-soft)] mb-3">
              {blogExcerpt(post)}
            </p>
            <Link
              to={`/blog/${post.slug}`}
              className="link-underline text-sm font-semibold text-[var(--accent)]"
            >
              {t('readFullPost')}
            </Link>
          </div>
        ))}
      </div>
    </Layout>
  );
};

export default BlogCategoryPage;
