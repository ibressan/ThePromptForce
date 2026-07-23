# salesforce-news-bot (private)

Automation that collects Salesforce community blog/feed news, generates a bilingual
(PT-BR + English) weekly summary via Google Gemini, distributes it via Telegram and
email, and publishes the result to the public
[`salesforce-news-community`](../salesforce-news-community) repository.

## Files

- `script.py` — orchestrates collection, generation, distribution and publishing.
- `prompt.py` — instruction prompt sent to Gemini.
- `requirements.txt` — Python dependencies.
- `.github/workflows/schedule.yml` — schedules the weekly run via GitHub Actions.

## Required secrets (Settings → Secrets and variables → Actions)

| Secret | Description |
|---|---|
| `GEMINI_API_KEY` | Google Gemini API key |
| `TELEGRAM_TOKEN` | Telegram bot token |
| `TELEGRAM_CHAT_ID` | Destination Telegram chat/channel ID |
| `GMAIL_APP_PASSWORD` | Gmail app password (not the regular account password) |
| `EMAIL_REMETENTE` | Gmail address used to send the email (also used for SMTP login) |
| `EMAIL_DESTINATARIO` | Email address that receives the summary (optional; falls back to `EMAIL_REMETENTE`) |
| `PAT_GITHUB` | Personal Access Token with write scope on the public repository |
| `PUBLIC_REPO_URL` | HTTPS URL of the public repository, e.g. `https://github.com/ibressan/salesforce-news-community.git` |

## Manual run

From GitHub: Actions → "Weekly Salesforce News Summary" → Run workflow, with optional inputs:

- `dry_run: true` — only generates the summary (printed to the log and uploaded as an
  artifact); does not touch Telegram, email, or the public repo. Only needs
  `GEMINI_API_KEY` and `PUBLIC_REPO_URL`.
- `skip_notifications: true` — generates the summary **and publishes it** to the public
  repo (new file in `editions/`, updated `README.md`), but skips Telegram/email. Needs
  `GEMINI_API_KEY`, `PAT_GITHUB` and `PUBLIC_REPO_URL` — the Telegram/Gmail secrets are
  not required in this mode.
- `list_models: true` — debug helper that lists the Gemini models available to the
  configured API key and exits.

With no inputs (or on the weekly schedule), it runs the full flow: generate, send to
Telegram and email, and publish.

Locally (requires the same environment variables exported):

```bash
pip install -r requirements.txt
python script.py
```
