import { ReactNode, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { PiSunBold, PiMoonBold } from 'react-icons/pi';
import { useLanguage } from '../i18n/LanguageContext';
import { CATEGORIES } from '../i18n/categories';
import { fetchBlogCategories } from '../i18n/fetchBlogPosts';
import { slugifyCategory } from '../i18n/feed';

const THEME_STORAGE_KEY = 'the-prompt-force-theme';

let cachedBlogCategories: string[] | null = null;

/** Fetches blog/index.json once (module-level cache) to build the blog's
 * category submenu — categories are free text per post, not a fixed list
 * like the news CATEGORIES, so this discovers them from what's published. */
const useBlogCategories = (): string[] => {
  const [categories, setCategories] = useState<string[]>(cachedBlogCategories ?? []);

  useEffect(() => {
    if (cachedBlogCategories) return;
    fetchBlogCategories().then((result) => {
      cachedBlogCategories = result;
      setCategories(result);
    });
  }, []);

  return categories;
};

const MODE_LINKS = [
  { to: '/', key: 'navHome' as const },
  { to: '/news', key: 'navNews' as const },
  { to: '/blog', key: 'navBlog' as const },
  { to: '/about', key: 'navAbout' as const },
];

const Layout = ({ children }: { children: ReactNode }) => {
  const { language, setLanguage, t } = useLanguage();
  const location = useLocation();
  const blogCategories = useBlogCategories();
  const [theme, setTheme] = useState<'light' | 'dark'>(
    () => (localStorage.getItem(THEME_STORAGE_KEY) as 'light' | 'dark') || 'light',
  );

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  const toggleTheme = () =>
    setTheme((current) => (current === 'light' ? 'dark' : 'light'));

  const inNews = location.pathname.startsWith('/news');
  const inBlog = location.pathname.startsWith('/blog');

  const subLinks = inNews
    ? CATEGORIES.map((c) => ({ to: `/news/category/${c.slug}`, label: c.label }))
    : inBlog
      ? blogCategories.map((c) => ({ to: `/blog/category/${slugifyCategory(c)}`, label: c }))
      : [];

  return (
    <div className="min-h-screen relative">
      <img
        src="/ThePromptForce/mascote/mascote-bg.png"
        alt=""
        aria-hidden="true"
        className="fixed bottom-0 left-0 w-[320px] sm:w-[440px] opacity-[0.5] pointer-events-none select-none -z-10"
      />

      <header className="sticky top-0 z-20 bg-[var(--bg)]/90 backdrop-blur border-b border-[var(--line)]">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-8">
          <Link to="/" className="font-bold text-sm shrink-0 flex items-center gap-2">
            <img src="/ThePromptForce/favicon-32x32.png" alt="" className="w-5 h-5" />
            The Prompt Force
          </Link>

          <nav className="hidden md:flex items-center gap-5 overflow-x-auto">
            {MODE_LINKS.map((link) => {
              const isActive =
                link.to === '/'
                  ? location.pathname === '/'
                  : location.pathname.startsWith(link.to);
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`whitespace-nowrap text-sm flex items-center gap-1.5 ${
                    isActive
                      ? 'text-[var(--accent)] font-semibold'
                      : 'text-[var(--ink-soft)] hover:text-[var(--ink)]'
                  }`}
                >
                  <span className="status-dot" />
                  {t(link.key)}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2 ml-auto shrink-0">
            <div className="flex">
              <button
                className={`lang-toggle-btn ${language === 'pt' ? 'active' : ''}`}
                onClick={() => setLanguage('pt')}
                aria-label="Português"
              >
                PT
              </button>
              <button
                className={`lang-toggle-btn ${language === 'en' ? 'active' : ''}`}
                onClick={() => setLanguage('en')}
                aria-label="English"
              >
                EN
              </button>
            </div>
            <button
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="w-8 h-8 flex items-center justify-center rounded-full border border-[var(--line)] text-[var(--ink-soft)] hover:text-[var(--accent)]"
            >
              {theme === 'dark' ? <PiSunBold /> : <PiMoonBold />}
            </button>
          </div>
        </div>

        {subLinks.length > 0 && (
          <div className="max-w-5xl mx-auto px-4 pb-3 flex items-center gap-4 overflow-x-auto">
            {subLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`tag-pill whitespace-nowrap ${
                  location.pathname === link.to ? 'bg-[var(--accent)] text-white border-[var(--accent)]' : ''
                }`}
              >
                #{link.label}
              </Link>
            ))}
          </div>
        )}
      </header>

      <div className="max-w-5xl mx-auto px-4 py-10">
        {children}

        <div className="rule mt-14 pt-4 text-center">
          <a
            href="https://github.com/ibressan/ThePromptForce"
            target="_blank"
            rel="noreferrer"
            className="link-underline text-xs text-[var(--ink-soft)]"
          >
            GitHub
          </a>
        </div>
      </div>
    </div>
  );
};

export default Layout;
