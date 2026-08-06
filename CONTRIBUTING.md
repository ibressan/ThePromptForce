# Contributing & maintainer docs

This repository is self-contained: the automation code (`script.py`, `prompt.py`,
workflow) and the generated content (`sources.json`, `editions/`) live together here. A
GitHub Actions workflow runs the script, which collects content from the sources,
calls Gemini, picks a cover image, and commits/pushes straight back to this same
repository — no separate repo, PAT, or cross-repo clone involved.

## 📂 Repository structure

- [`sources.json`](./sources.json) — list of source blogs/RSS feeds.
- [`editions/`](./editions/) — archive of past editions (Markdown, bilingual, with covers).
- [`script.py`](./script.py) / [`prompt.py`](./prompt.py) — the automation itself.
- [`.github/workflows/schedule.yml`](./.github/workflows/schedule.yml) — schedules the run via GitHub Actions.

## 🤝 How to contribute

### Suggest a new source (blog or RSS feed)

1. Fork this repository.
2. Edit [`sources.json`](./sources.json) and add a new item to the `sources` array:
   ```json
   {
     "name": "Blog Name",
     "url": "https://example.com/feed/",
     "type": "rss"
   }
   ```
   Use `"type": "rss"` for RSS/Atom feeds, or `"type": "html"` for pages without a feed
   (the bot will do simple scraping of the content).
3. Open a Pull Request explaining why the source is relevant to the Salesforce community.

### Suggest content improvements

Open an [Issue](../../issues) with suggestions about format, sections, or tone for the
editions.

## ⚙️ How it works

Uses the unified `google-genai` SDK (`from google import genai`) for text generation.
The cover is never generated or stored anywhere: each collected article already carries
its own image (extracted from `og:image`, RSS media fields, or the first inline `<img>`
— see `extract_rss_entry_image` / `extract_html_page_image` in `script.py`), and the same
Gemini call that writes the summary picks one of those URLs to use as the edition's cover
(the `COVER_IMAGE:` line in `prompt.py` / `script.py`). If no suitable image is found, the
run continues without a cover — a missing image never blocks publishing the text summary.

### Required secrets (Settings → Secrets and variables → Actions)

| Secret | Description |
|---|---|
| `GEMINI_API_KEY` | Google Gemini API key |
| `TELEGRAM_TOKEN` | Telegram bot token |
| `TELEGRAM_CHAT_ID` | Destination Telegram chat/channel ID |
| `GMAIL_APP_PASSWORD` | Gmail app password (not the regular account password) |
| `EMAIL_REMETENTE` | Gmail address used to send the email (also used for SMTP login) |
| `EMAIL_DESTINATARIO` | Email address that receives the summary (optional; falls back to `EMAIL_REMETENTE`) |

`TELEGRAM_*`, `GMAIL_APP_PASSWORD` and `EMAIL_*` are all optional — if unset, the script
skips that notification channel and still publishes the edition normally.

No PAT is needed — the workflow commits back to this same repository using the
default `GITHUB_TOKEN` (the workflow declares `permissions: contents: write`).

### Schedule

The workflow's cron fires every Monday, but `script.py`'s `is_biweekly_scheduled_week()`
skips odd ISO weeks when triggered by the schedule — net effect: runs every other
Monday. Manual runs (`workflow_dispatch`) always execute regardless of week parity.

### Manual run

From GitHub: Actions → "Salesforce News Summary" → Run workflow, with optional inputs:

- `dry_run: true` — only generates the summary (printed to the log and uploaded as an
  artifact); does not touch Telegram, email, or commit anything. Only needs
  `GEMINI_API_KEY`.
- `skip_notifications: true` — generates the summary **and publishes** (new file in
  `editions/`, updated `README.md`), but skips Telegram/email.
- `list_models: true` — debug helper that lists the Gemini models available to the
  configured API key and exits.
- `regenerate_date: YYYY-MM-DD` — overwrites an existing edition (by date) instead of
  creating one for today. Useful after a prompt change, to bring older editions in line
  with the new format/voice.

Locally (requires the same environment variables exported):

```bash
pip install -r requirements.txt
python script.py
```

## 📄 License

Content and code in this repository are available under the [MIT License](./LICENSE).
