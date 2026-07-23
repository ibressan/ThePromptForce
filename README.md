# salesforce-news-bot (privado)

Automação que coleta novidades de blogs/feeds da comunidade Salesforce, gera um resumo semanal
em PT-BR via Google Gemini, distribui via Telegram e e-mail, e publica o resultado no
repositório público [`salesforce-news-community`](../salesforce-news-community).

## Arquivos

- `script.py` — orquestra coleta, geração, distribuição e publicação.
- `prompt.py` — prompt de instruções enviado ao Gemini.
- `requirements.txt` — dependências Python.
- `.github/workflows/agendamento.yml` — agenda a execução semanal via GitHub Actions.

## Secrets necessários (Settings → Secrets and variables → Actions)

| Secret | Descrição |
|---|---|
| `GEMINI_API_KEY` | Chave da API do Google Gemini |
| `TELEGRAM_TOKEN` | Token do bot do Telegram |
| `TELEGRAM_CHAT_ID` | ID do chat/canal de destino no Telegram |
| `GMAIL_APP_PASSWORD` | Senha de app do Gmail (não a senha normal da conta) |
| `EMAIL_REMETENTE` | E-mail Gmail usado para enviar (também usado no login SMTP) |
| `EMAIL_DESTINATARIO` | E-mail que receberá o resumo (opcional; usa `EMAIL_REMETENTE` se omitido) |
| `PAT_GITHUB` | Personal Access Token com escopo de escrita no repositório público |
| `PUBLIC_REPO_URL` | URL HTTPS do repositório público, ex: `https://github.com/ibressan/salesforce-news-community.git` |

## Execução manual

Pelo GitHub: Actions → "Resumo Semanal Salesforce News" → Run workflow.

Localmente (requer as mesmas variáveis de ambiente exportadas):

```bash
pip install -r requirements.txt
python script.py
```
