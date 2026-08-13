import { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSlug from 'rehype-slug';
import Layout from '../components/Layout';
import { useLanguage } from '../i18n/LanguageContext';
import { parseBlogPost, ParsedBlogPost } from '../i18n/blogMarkdown';
import { AUTHOR_NAMES } from '../i18n/authors';
import { RAW_BASE as REPO_RAW_BASE } from '../i18n/repo';
import { slugifyCategory } from '../i18n/feed';

const RAW_BASE = `${REPO_RAW_BASE}blog/`;

const formatPostDate = (dateStr: string, language: string) =>
  new Date(dateStr).toLocaleDateString(language === 'pt' ? 'pt-BR' : 'en-US', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

const BlogPostPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { language, t } = useLanguage();
  const [post, setPost] = useState<ParsedBlogPost | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!slug) return;

    setPost(null);
    setError(false);

    fetch(`${RAW_BASE}${slug}.md`)
      .then((res) => {
        if (!res.ok) throw new Error('Not found');
        return res.text();
      })
      .then((text) => {
        const resolved = text.replace(
          /!\[([^\]]*)\]\((?!https?:\/\/)([^)]+)\)/g,
          (_match, alt, src) => `![${alt}](${RAW_BASE}${src})`,
        );
        setPost(parseBlogPost(resolved));
      })
      .catch(() => setError(true));
  }, [slug]);

  const bodyMarkdown = useMemo(() => {
    if (!post) return null;
    return `# ${post.frontmatter.title}\n\n${post.body}`;
  }, [post]);

  return (
    <Layout>
      <Link
        to="/blog"
        className="link-underline text-sm inline-flex items-baseline gap-1.5 mb-8"
      >
        <span className="font-mono">←</span> {t('backToBlog')}
      </Link>

      {error && <p className="text-[var(--ink-soft)]">{t('blogLoadError')}</p>}
      {!error && post === null && <p className="text-[var(--ink-soft)]">{t('loading')}</p>}

      {!error && post !== null && bodyMarkdown && (
        <>
          <div className="flex flex-wrap items-center gap-2 mb-4">
            {post.frontmatter.category && (
              <Link
                to={`/blog/category/${slugifyCategory(post.frontmatter.category)}`}
                className="tag-pill"
              >
                #{post.frontmatter.category}
              </Link>
            )}
            <span className="tag-pill">{AUTHOR_NAMES[post.frontmatter.author]}</span>
          </div>

          <div className="font-mono text-xs text-[var(--ink-soft)] mb-8">
            {formatPostDate(post.frontmatter.date, language)}
          </div>

          {post.frontmatter.cover && (
            <img
              src={post.frontmatter.cover}
              alt=""
              className="w-full rounded-xl mb-8 object-cover max-h-96"
            />
          )}

          <div className="surface-card surface-card-translucent p-5 sm:p-8">
            <article className="prose max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSlug]}>
                {bodyMarkdown}
              </ReactMarkdown>
            </article>
          </div>
        </>
      )}
    </Layout>
  );
};

export default BlogPostPage;
