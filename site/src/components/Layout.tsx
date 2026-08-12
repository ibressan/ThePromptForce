import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import { CATEGORIES } from '../i18n/categories';

const NAV_LINKS = [
  { to: '/', labelPt: 'Capa', labelEn: 'Front Page' },
  ...CATEGORIES.map((c) => ({ to: `/category/${c.slug}`, labelPt: c.label, labelEn: c.label })),
  { to: '/about', labelPt: 'Sobre', labelEn: 'About' },
];

const Layout = ({ children }: { children: ReactNode }) => {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 bg-[var(--bg)]/90 backdrop-blur border-b border-[var(--line)]">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-8">
          <Link to="/" className="font-bold text-sm shrink-0">
            Salesforce News
          </Link>

          <nav className="hidden md:flex items-center gap-5 overflow-x-auto">
            {NAV_LINKS.map((link, index) => (
              <Link
                key={link.to}
                to={link.to}
                className="whitespace-nowrap text-sm text-[var(--ink-soft)] hover:text-[var(--ink)] flex items-baseline gap-1.5"
              >
                <span className="tag-number">
                  /{String(index).padStart(2, '0')}
                </span>
                {language === 'pt' ? link.labelPt : link.labelEn}
              </Link>
            ))}
          </nav>

          <div className="flex ml-auto shrink-0">
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
