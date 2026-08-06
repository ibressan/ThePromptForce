export type Language = 'pt' | 'en';

export const STRINGS: Record<Language, Record<string, string>> = {
  pt: {
    back: 'Voltar',
    backToFrontPage: 'Voltar à capa',
    loading: 'Carregando…',
    editionLoadError: 'Não foi possível carregar esta edição.',
    inThisEdition: 'Nesta edição',
    allEditions: 'Todas as edições',
    readFullEdition: 'Ler edição completa',
    latestEdition: 'Edição mais recente',
    noEditions: 'Nenhuma edição publicada ainda.',
  },
  en: {
    back: 'Back',
    backToFrontPage: 'Back to front page',
    loading: 'Loading…',
    editionLoadError: 'Could not load this edition.',
    inThisEdition: 'In this edition',
    allEditions: 'All editions',
    readFullEdition: 'Read full edition',
    latestEdition: 'Latest edition',
    noEditions: 'No editions published yet.',
  },
};
