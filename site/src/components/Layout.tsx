import { ReactNode, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PiSunBold, PiMoonBold } from 'react-icons/pi';
import { useLanguage } from '../i18n/LanguageContext';
import { CATEGORIES } from '../i18n/categories';

const THEME_STORAGE_KEY = 'salesforce-news-theme';

const NAV_LINKS = [
  { to: '/', labelPt: 'Capa', labelEn: 'Front Page' },
  ...CATEGORIES.map((c) => ({ to: `/category/${c.slug}`, labelPt: c.label, labelEn: c.label })),
  { to: '/about', labelPt: 'Sobre', labelEn: 'About' },
];

const Layout = ({ children }: { children: ReactNode }) => {
  const { language, setLanguage } = useLanguage();
  const [theme, setTheme] = useState<'light' | 'dark'>(
    () => (localStorage.getItem(THEME_STORAGE_KEY) as 'light' | 'dark') || 'light',
  );

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  const toggleTheme = () =>
    setTheme((current) => (current === 'light' ? 'dark' : 'light'));

  return (
    <div className="min-h-screen relative">
      <img
        src="/salesforce-news/mascote/mascote-bg.png"
        alt=""
        aria-hidden="true"
        className="absolute bottom-0 left-0 w-[320px] sm:w-[440px] opacity-[0.35] pointer-events-none select-none -z-10"
      />

      <header className="sticky top-0 z-20 bg-[var(--bg)]/90 backdrop-blur border-b border-[var(--line)]">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-8">
          <Link to="/" className="font-bold text-sm shrink-0 flex items-center gap-2">
            <img src="/salesforce-news/favicon-32x32.png" alt="" className="w-5 h-5" />
            Salesforce News
          </Link>

          <nav className="hidden md:flex items-center gap-5 overflow-x-auto">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="whitespace-nowrap text-sm text-[var(--ink-soft)] hover:text-[var(--ink)] flex items-center gap-1.5"
              >
                <span className="status-dot" />
                {language === 'pt' ? link.labelPt : link.labelEn}
              </Link>
            ))}
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
      </header>

      <div className="max-w-5xl mx-auto px-4 py-10">
        {children}

        <div className="rule mt-14 pt-4 text-center">
          <a
            href="https://github.com/ibressan/salesforce-news"
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
