import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { useLanguage } from '../i18n/LanguageContext';

import { CONTENT_BASE } from '../i18n/repo';

const SOURCES_URL = `${CONTENT_BASE}news/sources.json`;

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
      <div className="flex items-center gap-2 mb-3">
        <span className="status-dot" />
        <span className="tag-number">
          {language === 'pt' ? 'SOBRE' : 'ABOUT'}
        </span>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:gap-8">
        <img
          src="/ThePromptForce/mascote/mascote-about.png"
          alt="Mascote Salesforce News"
          className="w-40 sm:w-56 shrink-0 mx-auto sm:mx-0 mb-4 sm:mb-0"
        />

        <div className="flex-1">
          <h1 className="text-3xl sm:text-4xl font-extrabold mb-6">
            {t('aboutTitle')}
          </h1>

          <article className="prose max-w-none font-serif-body">
        {language === 'pt' ? (
          <>
            <p>
              O <strong>The Prompt Force</strong> mistura dois formatos: uma
              digest semanal de notícias do ecossistema Salesforce, cobrindo
              Apex, LWC, Data Cloud, Flow e Admin, gerada automaticamente a
              partir de blogs e feeds da comunidade, e um blog com posts mais
              longos e opinativos sobre IA, automação e desenvolvimento.
              Publicado em Português (PT-BR) e English.
            </p>
            <p>
              Toda semana, um robô coleta os posts mais recentes das fontes
              listadas abaixo, envia esse conteúdo para o Google Gemini
              escrever uma edição bilíngue em tom editorial (não é uma lista
              seca de links: cada notícia vem com contexto e um argumento de
              por que vale a leitura), e publica automaticamente aqui.
            </p>
            <p>
              A capa de cada edição também não é gerada: é a própria imagem
              do artigo de origem que o Gemini escolheu como principal
              notícia da semana.
            </p>
          </>
        ) : (
          <>
            <p>
              <strong>The Prompt Force</strong> blends two formats: a weekly
              news digest of the Salesforce ecosystem, covering Apex, LWC,
              Data Cloud, Flow and Admin, automatically generated from
              community blogs and feeds, and a blog with longer, more
              opinionated posts about AI, automation and development.
              Published in both Brazilian Portuguese (PT-BR) and English.
            </p>
            <p>
              Every week, a bot collects the latest posts from the sources
              listed below, sends that content to Google Gemini to write a
              bilingual, editorial-toned edition (not a dry list of links:
              every story comes with context and a case for why it's worth
              reading), and publishes automatically here.
            </p>
            <p>
              Each edition's cover isn't generated either: it's the source
              article's own image, picked by Gemini as this week's lead
              story.
            </p>
          </>
        )}
          </article>
        </div>
      </div>

      <div className="rule mb-10 mt-10" />

      <div className="flex flex-col sm:flex-row sm:items-center sm:gap-8 mb-10">
        <img
          src="/ThePromptForce/mascote/mascote-cappy.png"
          alt="Cappy, mascote do The Prompt Force"
          className="w-40 sm:w-56 shrink-0 mx-auto sm:mx-0 mb-4 sm:mb-0"
        />

        <div className="flex-1">
          <h2 className="text-2xl font-extrabold mb-4">
            {language === 'pt' ? 'Quem é o Cappy?' : 'Meet Cappy'}
          </h2>
          <article className="prose max-w-none font-serif-body">
            {language === 'pt' ? (
              <p>
                <strong>Cappy</strong> é o mascote das notícias no The Prompt
                Force: uma capivara Trailblazer que mistura <em>code</em>,{' '}
                <em>copy</em> e um pouco de <em>happy</em>. Representa bem o
                que essa parte do projeto faz: ler tudo que sai sobre o
                ecossistema Salesforce e devolver em forma de resumo
                editorial, direto ao ponto. De vez em quando ele também
                aparece dando um pitaco no blog.
              </p>
            ) : (
              <p>
                <strong>Cappy</strong> is the news mascot on The Prompt Force:
                a Trailblazer capybara mixing <em>code</em>, <em>copy</em>,
                and a bit of <em>happy</em>. He's a fitting stand-in for what
                that side of the project does: read everything coming out of
                the Salesforce ecosystem and hand it back as a
                straight-to-the-point editorial digest. He occasionally
                shows up on the blog too.
              </p>
            )}
          </article>

          <p className="font-mono text-xs text-[var(--ink-soft)] mt-4">
            {language === 'pt'
              ? '🚧 Shel, o mascote do blog, está em produção. Chega em breve.'
              : "🚧 Shel, the blog's mascot, is in the works. Coming soon."}
          </p>
        </div>
      </div>

      <div className="rule mb-6" />
      <h2 className="text-2xl font-extrabold mb-4">{t('sourcesTitle')}</h2>
      <ul className="space-y-2">
        {sources.map((source) => (
          <li key={source.url} className="flex items-baseline gap-2">
            <span className="tag-pill">{source.type}</span>
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
