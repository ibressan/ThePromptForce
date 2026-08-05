# 📰 Salesforce News

AI-generated Salesforce ecosystem news digest covering **Apex, LWC, Data Cloud and Flow**
— bilingual (PT-BR / English), sourced from community blogs and RSS feeds, summarized by
Google Gemini.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
![Salesforce](https://img.shields.io/badge/Salesforce-00A1E0?logo=salesforce&logoColor=white)

**[🇧🇷 Português](#-português) | [🇺🇸 English](#-english)**

---

## 🇧🇷 Português

Resumos automáticos das novidades do ecossistema Salesforce, gerados por IA (Google Gemini) a partir de blogs e feeds da comunidade — publicados em **Português (PT-BR) e English**.

A cada execução, um robô coleta as publicações mais recentes das fontes listadas em [`sources.json`](./sources.json), gera um resumo técnico bilíngue com capa ilustrativa e atualiza este README e a pasta [`editions/`](./editions/).

### 🗞️ Última Edição

<!-- SALESFORCE_NEWS_START -->
### 🗓️ Edição de 2026-08-05 / Weekly Edition 2026-08-05

## 🇧🇷 Português

### 🚀 Novidades Técnicas

#### Apex
- **Skills de Contexto para a Metadata API**: A integração de contexto da Metadata API em assistentes de desenvolvimento de IA permite a geração de metadados e declarações de plataforma mais precisos, reduzindo falhas em compilações e validações de implantação. — 📅 30/07/2026 · 🔗 [Leia mais](https://developer.salesforce.com/blogs/2026/07/build-smarter-with-metadata-api-context-skills)
- **Otimização de Contexto para Agentes de IA com MCP+**: A camada de pós-processamento MCP+ intercepta as respostas de ferramentas do Model Context Protocol antes da entrega aos agentes. Essa abordagem filtra cargas úteis e reduz o consumo de tokens e custos de execução sem a necessidade de reescrever controladores Apex ou APIs legadas. — 📅 21/07/2026 · 🔗 [Leia mais](https://developer.salesforce.com/blogs/2026/07/get-started-with-precision-context-management-using-mcp)

#### LWC (Lightning Web Components)
- **Disponibilidade Geral (GA) do Salesforce Multi-Framework**: O Salesforce Multi-Framework alcançou GA, permitindo a execução nativa de aplicações React na plataforma sem a necessidade de implementar fluxos de autenticação customizados ou gerenciar tokens. A solução oferece suporte a manipulação de dados via GraphQL e chamadas diretas a controladores Apex. — 📅 23/07/2026 · 🔗 [Leia mais](https://developer.salesforce.com/blogs/2026/07/build-with-react-on-salesforce-multi-framework-is-now-ga-jp)

### 💡 Impacto Prático
A disponibilidade geral do Multi-Framework amplia as opções arquiteturais no front-end da plataforma, permitindo reutilizar aplicações React existentes sem comprometer o modelo de segurança nativo do Salesforce. Paralelamente, a adoção de técnicas como MCP+ e Context Skills na Metadata API reflete uma transição clara para o desenvolvimento voltado a agentes de IA, onde o gerenciamento de contexto e o controle do consumo de tokens se tornam requisitos diretos de arquitetura. Arquitetos e desenvolvedores devem avaliar o impacto financeiro das chamadas de IA atuais e testar o padrão Multi-Framework em sandboxes para mapear regras de governança e migração da fase beta.

### 📖 Destaque de Leitura
- [React no Salesforce: GA do Multi-Framework](https://developer.salesforce.com/blogs/2026/07/build-with-react-on-salesforce-multi-framework-is-now-ga-jp) — 📅 23/07/2026 · Guia essencial detalhando a execução nativa de React na plataforma, invocação de controladores Apex e integração GraphQL sem infraestrutura de autenticação adicional.
- [Gestão de Contexto de Precisão com MCP+](https://developer.salesforce.com/blogs/2026/07/get-started-with-precision-context-management-using-mcp) — 📅 21/07/2026 · Análise técnica sobre como interceptar e filtrar payloads de ferramentas MCP para otimizar custos com modelos de linguagem.
- [Geração de Metadados Inteligente com Metadata API Context Skills](https://developer.salesforce.com/blogs/2026/07/build-smarter-with-metadata-api-context-skills) — 📅 30/07/2026 · Explora o uso de contexto de metadados de orgs para eliminar erros de sintaxe e implantação em fluxos assistidos por IA.

## 🇺🇸 English

### 🚀 Technical News

#### Apex
- **Metadata API Context Skills for AI Development**: Grounding AI coding assistants with Metadata API context enables the generation of valid platform metadata definitions and payloads, significantly lowering deployment validation failures. — 📅 30/07/2026 · 🔗 [Read more](https://developer.salesforce.com/blogs/2026/07/build-smarter-with-metadata-api-context-skills)
- **Precision Context Management with MCP+**: The MCP+ post-processing layer intercepts Model Context Protocol tool responses before passing them to AI agents, filtering payloads to reduce token consumption and operational costs without requiring rewrites of underlying Apex services or APIs. — 📅 21/07/2026 · 🔗 [Read more](https://developer.salesforce.com/blogs/2026/07/get-started-with-precision-context-management-using-mcp)

#### LWC (Lightning Web Components)
- **Salesforce Multi-Framework General Availability (GA)**: Salesforce Multi-Framework is now GA, allowing teams to build native React applications on Salesforce without handling custom authentication or token management. The framework natively integrates GraphQL data operations and direct Apex invocations. — 📅 23/07/2026 · 🔗 [Read more](https://developer.salesforce.com/blogs/2026/07/build-with-react-on-salesforce-multi-framework-is-now-ga-jp)

### 💡 Practical Impact
The general availability of Multi-Framework expands front-end architectural choices on the platform, allowing engineering teams to reuse existing React components without compromising platform security or authentication boundaries. Simultaneously, adopting context interception like MCP+ and Metadata API Context Skills signals a shift toward agentic AI optimization, where controlling token overhead directly dictates operational viability. Solution architects should benchmark token efficiency across current agent workflows and evaluate React integration patterns in sandboxes ahead of enterprise deployment.

### 📖 Reading Highlight
- [Building with React: Multi-Framework reaches GA](https://developer.salesforce.com/blogs/2026/07/build-with-react-on-salesforce-multi-framework-is-now-ga-jp) — 📅 23/07/2026 · A crucial guide detailing native React execution on Salesforce, Apex controller invocation, GraphQL usage, and breaking changes from beta.
- [Precision Context Management Using MCP+](https://developer.salesforce.com/blogs/2026/07/get-started-with-precision-context-management-using-mcp) — 📅 21/07/2026 · Must-read architectural deep dive into intercepting MCP responses to minimize token overhead in agent deployments.
- [Build Smarter with Metadata API Context Skills](https://developer.salesforce.com/blogs/2026/07/build-smarter-with-metadata-api-context-skills) — 📅 30/07/2026 · Explores how grounding AI assistants in org-specific metadata prevents deployment syntax errors.

📄 [Ver esta edição no histórico / View this edition in the archive](editions/2026-08-05.md)
<!-- SALESFORCE_NEWS_END -->

📂 Veja o histórico completo em [`editions/`](./editions/).

### 🤝 Como colaborar

**Sugerir uma nova fonte (blog ou feed RSS)**

1. Faça um fork deste repositório.
2. Edite o arquivo [`sources.json`](./sources.json) adicionando um novo item ao array `sources`:
   ```json
   {
     "name": "Nome do Blog",
     "url": "https://exemplo.com/feed/",
     "type": "rss"
   }
   ```
   Use `"type": "rss"` para feeds RSS/Atom ou `"type": "html"` para páginas sem feed (o robô fará scraping simples do conteúdo).
3. Abra um Pull Request explicando por que a fonte é relevante para a comunidade Salesforce.

**Sugerir melhorias no conteúdo**

Abra uma [Issue](../../issues) com sugestões de formato, seções ou tom das edições.

### ⚙️ Como funciona

Este repositório é auto-contido: o código de automação (`script.py`, `prompt.py`, workflow) e o conteúdo gerado (`sources.json`, `editions/`) vivem juntos aqui. Um workflow do GitHub Actions roda o script, que coleta o conteúdo, chama o Gemini, gera a capa e faz commit/push direto neste mesmo repositório.

---

## 🇺🇸 English

Automated summaries of Salesforce ecosystem news, generated by AI (Google Gemini) from community blogs and feeds — published in **both Brazilian Portuguese (PT-BR) and English**.

On each run, a bot collects the latest posts from the sources listed in [`sources.json`](./sources.json), generates a bilingual technical summary with a cover illustration, and updates this README plus the [`editions/`](./editions/) folder.

> Each edition already contains both language versions side by side (Português above, English below) — see the [🇧🇷 Português](#-última-edição) section above for the latest one.

### 📂 Repository structure

- [`sources.json`](./sources.json) — list of source blogs/RSS feeds.
- [`editions/`](./editions/) — archive of past editions (Markdown, bilingual, with covers).
- [`script.py`](./script.py) / [`prompt.py`](./prompt.py) — the automation itself.
- [`.github/workflows/schedule.yml`](./.github/workflows/schedule.yml) — schedules the run via GitHub Actions.

### 🤝 How to contribute

**Suggest a new source (blog or RSS feed)**

1. Fork this repository.
2. Edit [`sources.json`](./sources.json) and add a new item to the `sources` array:
   ```json
   {
     "name": "Blog Name",
     "url": "https://example.com/feed/",
     "type": "rss"
   }
   ```
   Use `"type": "rss"` for RSS/Atom feeds, or `"type": "html"` for pages without a feed (the bot will do simple scraping of the content).
3. Open a Pull Request explaining why the source is relevant to the Salesforce community.

**Suggest content improvements**

Open an [Issue](../../issues) with suggestions about format, sections, or tone for the editions.

### ⚙️ How it works

This repository is self-contained: the automation code (`script.py`, `prompt.py`, workflow) and the generated content (`sources.json`, `editions/`) live together here. A GitHub Actions workflow runs the script, which collects content, calls Gemini, generates the cover, and commits/pushes straight back to this same repository.

### 📄 License

Content and code in this repository are available under the [MIT License](./LICENSE).

---

## 🛠️ Automation details (maintainers)

Uses the unified `google-genai` SDK (`from google import genai`) for text generation.
The cover does **not** go through Gemini/Imagen — every image-capable Gemini/Imagen
model has a free-tier quota of 0 (confirmed via testing), so the cover is generated via
[Pollinations.ai](https://pollinations.ai) instead, which needs no API key or billing.
The cover's visual theme is driven by the content itself: the same Gemini call that
writes the summary also returns a short list of visual concepts extracted from that
edition's news (the `VISUAL_THEMES:` line in `prompt.py` / `script.py`), which get woven
into the Pollinations prompt. If image generation fails for any reason, the run
continues without a cover — a missing image never blocks publishing the text summary.

### Required secrets (Settings → Secrets and variables → Actions)

| Secret | Description |
|---|---|
| `GEMINI_API_KEY` | Google Gemini API key |
| `TELEGRAM_TOKEN` | Telegram bot token |
| `TELEGRAM_CHAT_ID` | Destination Telegram chat/channel ID |
| `GMAIL_APP_PASSWORD` | Gmail app password (not the regular account password) |
| `EMAIL_REMETENTE` | Gmail address used to send the email (also used for SMTP login) |
| `EMAIL_DESTINATARIO` | Email address that receives the summary (optional; falls back to `EMAIL_REMETENTE`) |

No PAT is needed — the workflow commits back to this same repository using the
default `GITHUB_TOKEN` (the workflow declares `permissions: contents: write`).

### Schedule

The workflow's cron fires every Monday, but `script.py`'s `is_biweekly_scheduled_week()`
skips odd ISO weeks when triggered by the schedule — net effect: runs every other
Monday. Manual runs (`workflow_dispatch`) always execute regardless of week parity.

### Manual run

From GitHub: Actions → "Salesforce News Summary" → Run workflow, with optional inputs:

- `dry_run: true` — only generates the summary and cover (uploaded as an artifact);
  does not touch Telegram, email, or commit anything. Only needs `GEMINI_API_KEY`.
- `skip_notifications: true` — generates the summary and cover **and publishes**
  (new file in `editions/`, updated `README.md`), but skips Telegram/email.
- `list_models: true` — debug helper that lists the Gemini models available to the
  configured API key and exits.

Locally (requires the same environment variables exported):

```bash
pip install -r requirements.txt
python script.py
```

---

<sub>Automatically generated by a GitHub Actions workflow. Last updated: see commit history.</sub>
