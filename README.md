# salesforce-news-bot (private)

Automation that collects Salesforce community blog/feed news, generates a bilingual
(PT-BR + English) summary via Google Gemini (`gemini-flash-latest`) plus a cover
illustration via Imagen (`imagen-4.0-generate-001`), distributes the summary via
Telegram and email, and publishes the result (text + cover) to the public
[`salesforce-news-community`](../salesforce-news-community) repository.

Cadence isn't finalized yet — it currently runs biweekly (see the "Schedule" section
below), not weekly.

Uses the unified `google-genai` SDK (`from google import genai`) for both text and
image generation — the older `google-generativeai` package doesn't support Imagen.

The cover's visual theme is driven by the content itself: the same Gemini call that
writes the summary also returns a short list of visual concepts extracted from that
edition's news (see the `VISUAL_THEMES:` line handling in `prompt.py` / `script.py`),
which get woven into the Imagen prompt. If image generation fails for any reason (quota,
model availability, etc.), the run continues without a cover — a missing image never
blocks publishing the text summary.

## Files

- `script.py` — orchestrates collection, generation, distribution and publishing.
- `prompt.py` — instruction prompt sent to Gemini.
- `requirements.txt` — Python dependencies.
- `.github/workflows/schedule.yml` — schedules the run via GitHub Actions.

## Schedule

The workflow's cron fires every Monday, but `script.py`'s `is_biweekly_scheduled_week()`
skips odd ISO weeks when triggered by the schedule — net effect: runs every other
Monday. Manual runs (`workflow_dispatch`, e.g. `dry_run`/`skip_notifications`) always
execute regardless of week parity. To go back to weekly, remove that check in
`main()`.

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

From GitHub: Actions → "Salesforce News Summary" → Run workflow, with optional inputs:

- `dry_run: true` — only generates the summary (printed to the log and uploaded as an
  artifact); does not touch Telegram, email, or the public repo. Only needs
  `GEMINI_API_KEY` and `PUBLIC_REPO_URL`.
- `skip_notifications: true` — generates the summary **and publishes it** to the public
  repo (new file in `editions/`, updated `README.md`), but skips Telegram/email. Needs
  `GEMINI_API_KEY`, `PAT_GITHUB` and `PUBLIC_REPO_URL` — the Telegram/Gmail secrets are
  not required in this mode.
- `list_models: true` — debug helper that lists the models (text and image) available to
  the configured API key and exits.

With no inputs (or on a scheduled biweekly Monday), it runs the full flow: generate,
send to Telegram and email, and publish.

Locally (requires the same environment variables exported):

```bash
pip install -r requirements.txt
python script.py
```
