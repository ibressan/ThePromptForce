import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { useLanguage } from '../i18n/LanguageContext';

const REPO = 'ibressan/salesforce-news';
const SOURCES_URL = `https://raw.githubusercontent.com/${REPO}/main/sources.json`;

interface Source {
  name: string;
  url: string;
  type: string;
}

// Turns a feed URL into the human-facing blog homepage, for display —
// e.g. "https://www.salesforceben.com/feed/" -> "https://www.salesforceben.com/".
const toHomepage = (feedUrl: string): string => {
  try {
    const url = new URL(feedUrl);
    const path = url.pathname
      .replace(/\/feed\/?$/, '')
      .replace(/\/feeds\/posts\/default$/, '');
    return `${url.origin}${path || '/'}`;
  } catch {
    return feedUrl;
  }
};

const AboutPage = () => {
  const { language, t } = useLanguage();
  const [sources, setSources] = useState<Source[]>([]);

  useEffect(() => {
    fetch(SOURCES_URL)
      .then((res) => res.json())
      .then((data) => setSources(data.sources ?? []))
      .catch(() => setSources([]));
  }, []);

  return (
    <Layout>
      <h1 className="masthead-title text-3xl sm:text-4xl mb-6">
        {t('aboutTitle')}
      </h1>

      <article className="prose max-w-none mb-10">
        {language === 'pt' ? (
          <>
            <p>
              O <strong>Salesforce News</strong> é um resumo editorial semanal
              do ecossistema Salesforce — cobrindo Apex, LWC, Data Cloud,
              Flow e Admin — gerado automaticamente a partir de blogs e feeds
              da comunidade, publicado em Português (PT-BR) e English.
            </p>
            <p>
              Toda semana, um robô coleta os posts mais recentes das fontes
              listadas abaixo, envia esse conteúdo para o Google Gemini
              escrever uma edição bilíngue em tom editorial (não é uma lista
              seca de links — cada notícia vem com contexto e um argumento de
              por que vale a leitura), e publica automaticamente aqui e no{' '}
              <a
                href={`https://github.com/${REPO}`}
                target="_blank"
                rel="noreferrer"
                className="link-underline"
              >
                repositório no GitHub
              </a>
              .
            </p>
            <p>
              A capa de cada edição também não é gerada — é a própria imagem
              do artigo de origem que o Gemini escolheu como principal
              notícia da semana.
            </p>
          </>
        ) : (
          <>
            <p>
              <strong>Salesforce News</strong> is a weekly editorial digest of
              the Salesforce ecosystem — covering Apex, LWC, Data Cloud, Flow
              and Admin — automatically generated from community blogs and
              feeds, published in both Brazilian Portuguese (PT-BR) and
              English.
            </p>
            <p>
              Every week, a bot collects the latest posts from the sources
              listed below, sends that content to Google Gemini to write a
              bilingual, editorial-toned edition (not a dry list of links —
              every story comes with context and a case for why it's worth
              reading), and publishes automatically here and on the{' '}
              <a
                href={`https://github.com/${REPO}`}
                target="_blank"
                rel="noreferrer"
                className="link-underline"
              >
                GitHub repository
              </a>
              .
            </p>
            <p>
              Each edition's cover isn't generated either — it's the source
              article's own image, picked by Gemini as this week's lead
              story.
            </p>
          </>
        )}
      </article>

      <div className="rule mb-6" />
      <h2 className="masthead-title text-2xl mb-4">{t('sourcesTitle')}</h2>
      <ul className="space-y-2">
        {sources.map((source) => (
          <li key={source.url} className="flex items-baseline gap-2">
            <span className="text-xs uppercase tracking-widest opacity-50">
              {source.type}
            </span>
            <a
              href={toHomepage(source.url)}
              target="_blank"
              rel="noreferrer"
              className="link-underline font-semibold"
            >
              {source.name}
            </a>
          </li>
        ))}
      </ul>
    </Layout>
  );
};

export default AboutPage;
