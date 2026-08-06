import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import { CATEGORIES } from '../i18n/categories';

const Layout = ({ children }: { children: ReactNode }) => {
  const { language, setLanguage, t } = useLanguage();

  return (
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="flex justify-end mb-2">
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

        <Link to="/" className="block text-center rule-thin border-t-0 pb-4 mb-4">
          <div className="masthead-title text-5xl sm:text-6xl uppercase tracking-tight">
            Salesforce News
          </div>
          <div className="text-xs sm:text-sm uppercase tracking-[0.3em] opacity-60 mt-2">
            {language === 'pt'
              ? 'Resumo editorial do ecossistema Salesforce'
              : 'Editorial digest of the Salesforce ecosystem'}
          </div>
        </Link>

        <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs sm:text-sm uppercase tracking-widest rule-thin border-b-0 pt-3 mb-8">
          <Link to="/" className="link-underline">
            {t('navFrontPage')}
          </Link>
          {CATEGORIES.map((category) => (
            <Link
              key={category.slug}
              to={`/category/${category.slug}`}
              className="link-underline"
            >
              {category.label}
            </Link>
          ))}
          <Link to="/about" className="link-underline">
            {t('navAbout')}
          </Link>
        </nav>

        {children}

        <div className="rule mt-14 pt-4 text-center text-xs opacity-60">
          <a
            href="https://github.com/ibressan/salesforce-news"
            target="_blank"
            rel="noreferrer"
            className="link-underline"
          >
            GitHub
          </a>
        </div>
      </div>
    </div>
  );
};

export default Layout;
