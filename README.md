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
### 🗓️ Edição de 2026-07-23 / Weekly Edition 2026-07-23

![Cover](editions/cover-2026-07-23.jpg)

## 🇧🇷 Português

### 🚀 Novidades Técnicas

#### LWC (Lightning Web Components)
- O **Salesforce Multi-Framework** atingiu disponibilidade geral (GA), permitindo a construção e implantação nativa de aplicações React na plataforma Salesforce com suporte nativo a autenticação, governança, operações de dados via GraphQL e invocação direta de métodos Apex — 📅 16/07/2026 · 🔗 [Leia mais](https://developer.salesforce.com/blogs/2026/07/build-with-react-on-salesforce-multi-framework-is-now-ga)

#### Data Cloud
- Análises de arquitetura no Data Cloud (Data 360) reforçam que as funcionalidades de unificação e resolução de identidade não substituem a necessidade de governança de dados, regras de *survivorship* e *stewardship* diretamente nos sistemas de origem — 📅 22/07/2026 · 🔗 [Leia mais](https://www.salesforceben.com/deduplication-and-data-cloud-you-have-an-architecture-problem/)

#### Flow
- A integração de **Hosted MCP Servers** com o Slackbot via Headless 360 permite a execução segura de Flows do Salesforce, consultas ao CRM e execução de queries no Tableau diretamente a partir de interfaces conversacionais — 📅 15/07/2026 · 🔗 [Leia mais](https://developer.salesforce.com/blogs/2026/07/connect-slack-to-salesforce-with-hosted-mcp-servers)

### 💡 Impacto Prático

A disponibilidade geral do Salesforce Multi-Framework altera a estratégia de desenvolvimento de interfaces customizadas, permitindo que equipes utilizem React nativamente sem recorrer a soluções não suportadas para contornar o container do Lightning. No ecossistema de integração e inteligência artificial, a maturidade do padrão Model Context Protocol (MCP) exige que arquitetos avaliem a eficiência da janela de contexto e o consumo de tokens ao expor rotinas em Flow e dados do CRM a agentes externos. Além disso, projetos de Data Cloud devem priorizar a higienização e governança preventiva de dados na origem, evitando falhas de confiabilidade ao depender exclusivamente da resolução automática de duplicatas.

### 📖 Destaque de Leitura

- [Architecting Secure Agent Connectivity: A Guide to Choosing Between MCP and APIs](https://www.salesforce.com/blog/architecting-secure-agent-connectivity-mcp-apis/) — 📅 22/07/2026 · Guia arquitetural focado nos critérios de decisão entre o uso de Model Context Protocol (MCP) e APIs REST tradicionais ao expor dados e automações do Salesforce para agentes de IA de terceiros.
- [Build with React on Salesforce: Multi-Framework Is Now GA](https://developer.salesforce.com/blogs/2026/07/build-with-react-on-salesforce-multi-framework-is-now-ga) — 📅 16/07/2026 · Artigo técnico detalhando a transição do Multi-Framework para GA, incluindo padrões de segurança, operações GraphQL e procedimentos de migração do beta.
- [Get Started with Precision Context Management Using MCP+](https://developer.salesforce.com/blogs/2026/07/get-started-with-precision-context-management-using-mcp) — 📅 21/07/2026 · Apresenta uma camada de pós-processamento para otimizar respostas de ferramentas MCP, otimizando o consumo de janela de contexto e reduzindo custos operacionais em LLMs.

## 🇺🇸 English

### 🚀 Technical News

#### LWC (Lightning Web Components)
- **Salesforce Multi-Framework** is now Generally Available (GA), enabling engineering teams to deploy production-ready React applications natively on Salesforce with built-in authentication, security governance, GraphQL data operations, and direct Apex execution — 📅 16/07/2026 · 🔗 [Read more](https://developer.salesforce.com/blogs/2026/07/build-with-react-on-salesforce-multi-framework-is-now-ga)

#### Data Cloud
- Architectural guidance for Data Cloud (Data 360) highlights that automated identity resolution and data activation cannot replace source-system data governance, survivorship rules, and data stewardship — 📅 22/07/2026 · 🔗 [Read more](https://www.salesforceben.com/deduplication-and-data-cloud-you-have-an-architecture-problem/)

#### Flow
- **Hosted MCP Servers** combined with Headless 360 allow Slackbot integrations to securely trigger Salesforce Flows, execute Tableau queries, and retrieve CRM records directly within conversational workflows — 📅 15/07/2026 · 🔗 [Read more](https://developer.salesforce.com/blogs/2026/07/connect-slack-to-salesforce-with-hosted-mcp-servers)

### 💡 Practical Impact

The GA release of Salesforce Multi-Framework represents a shift in front-end architecture, allowing developers to build native React components on top of Salesforce core security without relying on container workaround hacks. As AI agent integration patterns standardize around Model Context Protocol (MCP), architects must establish strict controls over context window usage and payload optimization using tools like MCP+. Concurrently, Data Cloud implementations must emphasize upstream data hygiene rather than assuming automated identity resolution will resolve underlying duplicate data debt.

### 📖 Reading Highlight

- [Architecting Secure Agent Connectivity: A Guide to Choosing Between MCP and APIs](https://www.salesforce.com/blog/architecting-secure-agent-connectivity-mcp-apis/) — 📅 22/07/2026 · An essential architectural breakdown comparing trade-offs between Model Context Protocol (MCP) and REST APIs when exposing enterprise CRM logic to external AI agents.
- [Build with React on Salesforce: Multi-Framework Is Now GA](https://developer.salesforce.com/blogs/2026/07/build-with-react-on-salesforce-multi-framework-is-now-ga) — 📅 16/07/2026 · A deep dive into Multi-Framework reaching GA status, covering migration steps, GraphQL data fetching, and native platform security rules.
- [Get Started with Precision Context Management Using MCP+](https://developer.salesforce.com/blogs/2026/07/get-started-with-precision-context-management-using-mcp) — 📅 21/07/2026 · Introduces a post-processing layer for MCP tool responses designed to filter unnecessary context and lower LLM token consumption.

📄 [Ver esta edição no histórico / View this edition in the archive](editions/2026-07-23.md)
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
