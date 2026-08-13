# Blog

Formato dos posts do blog do The Prompt Force — diferente das edições de
notícias (`editions/*.md`), cada post é um arquivo único, geralmente em um só
idioma, escrito por um dos dois mascotes (Cappy ou Shel).

## Formato de um post

Arquivo: `blog/{YYYY-MM-DD}-{slug}.md`, com frontmatter YAML simples (só
`chave: valor`, sem listas/objetos aninhados) seguido do corpo em markdown:

```md
---
title: "Título do post"
date: 2026-08-13
author: shel
category: "IA & Automação"
cover: "https://.../imagem.jpg"
excerpt: "Resumo curto de 1-2 frases, usado nos cards de listagem."
---

Corpo do post em markdown — imagens, headings, tudo que um blog de
verdade tem.
```

Campos:

- `title` — obrigatório.
- `date` — obrigatório, `YYYY-MM-DD`.
- `author` — `cappy` ou `shel`. Cada mascote é dono do seu formato (Shel do
  blog, Cappy da news) mas pode publicar no outro ocasionalmente — é só
  trocar o valor.
- `category` — texto livre. Não existe uma lista fixa de categorias em
  código: o menu de categorias do blog no site é montado a partir do que já
  foi publicado (via `blog/index.json`).
- `cover` — opcional, URL de uma imagem de capa.
- `excerpt` — opcional; se ausente, o site usa o início do corpo.

## Publicando um post

1. Criar o arquivo `blog/{YYYY-MM-DD}-{slug}.md` com o frontmatter acima.
2. Adicionar uma entrada em `blog/index.json`, no formato:
   ```json
   { "slug": "2026-08-13-titulo-do-post", "date": "2026-08-13", "category": "IA & Automação" }
   ```
   (o `slug` é o nome do arquivo sem `.md`). Mantenha a lista ordenada da
   mais recente pra mais antiga.
3. Commit + push em `main` — o deploy do site é automático
   (`.github/workflows/pages.yml`).

Isso é manual por enquanto. Uma fase futura automatiza a geração de
rascunhos via IA (Gemini) com revisão humana antes de publicar, análogo ao
pipeline de notícias (`script.py`) — nessa fase, `blog/index.json` passa a
ser mantido automaticamente, igual ao `editions/index.json` da news.
