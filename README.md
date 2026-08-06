# 📰 Salesforce News

AI-generated Salesforce ecosystem news digest covering **Apex, LWC, Data Cloud, Flow and
Admin** — bilingual (PT-BR / English), sourced from community blogs and RSS feeds,
summarized by Google Gemini.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
![Salesforce](https://img.shields.io/badge/Salesforce-00A1E0?logo=salesforce&logoColor=white)

**[🇧🇷 Português](#-português) | [🇺🇸 English](#-english)** · [Como funciona / How it works](./CONTRIBUTING.md)

---

## 🇧🇷 Português

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

---

## 🇺🇸 English

Automated summaries of Salesforce ecosystem news, generated by AI (Google Gemini) from
community blogs and feeds — published in **both Brazilian Portuguese (PT-BR) and
English**. See the [🇧🇷 Português](#-última-edição) section above for the latest edition
(each one already contains both language versions side by side).

📂 Browse the full archive at [`editions/`](./editions/).

---

Want to suggest a new source, understand how the automation works, or run it yourself?
See [CONTRIBUTING.md](./CONTRIBUTING.md).

<sub>Automatically generated by a GitHub Actions workflow. Last updated: see commit history.</sub>
