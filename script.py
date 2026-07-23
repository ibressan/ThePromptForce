"""
Main script for the Salesforce News bot.

This repository is self-contained: the automation code and the generated content
(sources.json, editions/, README.md) live in the same public repo, so the workflow
just checks the repo out, runs this script, and pushes back to itself — no separate
repo, PAT, or cross-repo clone involved.

Flow:
  1. Reads sources.json (repo root) and collects content (RSS and HTML).
  2. Sends the raw content to Gemini, which generates the bilingual (PT-BR + English)
     weekly summary plus a short list of visual themes for the cover art.
  3. Generates a cover illustration for the edition via the free Pollinations.ai image
     API, using those themes (no API key or billing required).
  4. Distributes the summary via Telegram and email.
  5. Saves the new edition to editions/YYYY-MM-DD.md (with the cover) and updates README.md.
  6. Commits and pushes the changes.

Set DRY_RUN=true to only collect sources and generate the summary and cover (saved
locally as dry_run_summary.md / dry_run_cover.jpg) without sending Telegram/email or
committing/pushing anything.

Set SKIP_NOTIFICATIONS=true to generate and publish (commit/push) without sending
Telegram/email.

All credentials are read exclusively from environment variables (os.environ).
No key, token or password should ever be hardcoded in this file.
"""

import json
import os
import re
import smtplib
import subprocess
import sys
import time
from datetime import datetime, timedelta, timezone
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from urllib.parse import quote

import feedparser
import markdown as md_lib
import requests
from bs4 import BeautifulSoup
from google import genai

from prompt import build_image_prompt, build_prompt

GEMINI_MODEL = "gemini-flash-latest"
IMAGE_WIDTH = 1200
IMAGE_HEIGHT = 675
IMAGE_TIMEOUT = 60

MAX_CHARS_PER_SOURCE = 4000
MAX_RSS_ENTRIES_PER_SOURCE = 5
MAX_AGE_DAYS = 15
HTTP_TIMEOUT = 15

MARKER_START = "<!-- SALESFORCE_NEWS_START -->"
MARKER_END = "<!-- SALESFORCE_NEWS_END -->"


# --------------------------------------------------------------------------
# Content ingestion
# --------------------------------------------------------------------------
def load_sources(sources_path="sources.json"):
    """Loads the list of sources from sources.json (repo root)."""
    with open(sources_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    return data.get("sources", [])


def entry_published_at(entry):
    """Returns the entry's publish date as a UTC datetime, or None if the feed doesn't provide one."""
    for field in ("published_parsed", "updated_parsed"):
        value = entry.get(field)
        if value:
            return datetime(*value[:6], tzinfo=timezone.utc)
    return None


def collect_rss(name, url, max_age_days=MAX_AGE_DAYS):
    """Extracts the most recent entries from an RSS/Atom feed, skipping ones older than max_age_days."""
    feed = feedparser.parse(url)
    cutoff = datetime.now(timezone.utc) - timedelta(days=max_age_days)
    parts = []
    for entry in feed.entries:
        if len(parts) >= MAX_RSS_ENTRIES_PER_SOURCE:
            break
        published_at = entry_published_at(entry)
        if published_at is not None and published_at < cutoff:
            continue
        title = entry.get("title", "").strip()
        link = entry.get("link", "").strip()
        summary_html = entry.get("summary", "") or entry.get("description", "")
        summary_text = BeautifulSoup(summary_html, "html.parser").get_text(" ", strip=True)
        date_label = published_at.strftime("%Y-%m-%d") if published_at else "unknown"
        parts.append(f"### {title}\nPublished: {date_label}\nLink: {link}\n{summary_text}")
    return "\n\n".join(parts)[:MAX_CHARS_PER_SOURCE]


def collect_html(name, url):
    """Does simple scraping of a page that has no RSS feed available.

    There's no structured per-article publish date here (just a raw page scrape), so the
    date is marked as unknown to prevent the model from inventing one.
    """
    response = requests.get(url, timeout=HTTP_TIMEOUT, headers={"User-Agent": "Mozilla/5.0"})
    response.raise_for_status()
    soup = BeautifulSoup(response.text, "html.parser")
    for tag in soup(["script", "style", "nav", "footer", "header"]):
        tag.decompose()
    text = soup.get_text(" ", strip=True)
    return f"Published: unknown\nLink: {url}\n{text}"[:MAX_CHARS_PER_SOURCE]


def collect_all_sources(sources):
    """Collects content from all sources, skipping individual failures without aborting."""
    blocks = []
    for source in sources:
        name = source.get("name", "Unnamed source")
        url = source.get("url")
        source_type = source.get("type", "rss")
        try:
            if source_type == "rss":
                content = collect_rss(name, url)
            else:
                content = collect_html(name, url)
            if content:
                blocks.append(f"## Source: {name} ({url})\n{content}")
        except Exception as error:
            print(f"[WARNING] Failed to collect '{name}' ({url}): {error}", file=sys.stderr)
    return "\n\n".join(blocks)


# --------------------------------------------------------------------------
# Summary generation with Gemini
# --------------------------------------------------------------------------
def generate_summary(raw_content, api_key, max_attempts=3):
    """Calls the Gemini API to generate the bilingual (PT-BR + English) weekly summary,
    followed by a VISUAL_THEMES line (see extract_visual_themes).

    Retries with backoff on transient server errors (e.g. 503 "high demand") — this call
    is the one step nothing else in the pipeline can proceed without, so it's worth
    riding out a temporary blip rather than failing the whole run.
    """
    client = genai.Client(api_key=api_key)
    final_prompt = build_prompt(raw_content)
    for attempt in range(1, max_attempts + 1):
        try:
            response = client.models.generate_content(model=GEMINI_MODEL, contents=final_prompt)
            return response.text.strip()
        except Exception as error:
            if attempt == max_attempts:
                raise
            wait_seconds = 15 * attempt
            print(
                f"[WARNING] Gemini call failed (attempt {attempt}/{max_attempts}): {error}. "
                f"Retrying in {wait_seconds}s...",
                file=sys.stderr,
            )
            time.sleep(wait_seconds)


def extract_visual_themes(raw_summary):
    """Splits off the trailing 'VISUAL_THEMES: a, b, c' line from the generated summary.

    Returns (summary_markdown, visual_themes_list). If the line isn't present, returns
    the summary unchanged and an empty theme list (the cover prompt falls back to a
    generic Salesforce theme in that case).
    """
    match = re.search(r"^VISUAL_THEMES:\s*(.+)$", raw_summary, re.MULTILINE)
    if not match:
        return raw_summary.strip(), []
    themes = [t.strip() for t in match.group(1).split(",") if t.strip()]
    summary_markdown = raw_summary[: match.start()].rstrip()
    return summary_markdown, themes


def generate_cover_image(visual_themes, output_path, max_attempts=2):
    """Generates the edition's cover illustration via the free Pollinations.ai image API
    and saves it to output_path.

    No API key or billing needed — this replaces Gemini/Imagen for the cover, since
    image generation there requires a paid Google AI Studio plan (the free tier's quota
    for every image-capable model is 0). Returns True on success, False on failure — a
    missing cover should never abort the whole run, since the text summary is the
    primary deliverable, so failures (including after retries) are caught and logged
    rather than raised.
    """
    url = f"https://image.pollinations.ai/prompt/{quote(build_image_prompt(visual_themes))}"
    params = {"width": IMAGE_WIDTH, "height": IMAGE_HEIGHT, "nologo": "true"}
    for attempt in range(1, max_attempts + 1):
        try:
            response = requests.get(url, params=params, timeout=IMAGE_TIMEOUT)
            response.raise_for_status()
            with open(output_path, "wb") as f:
                f.write(response.content)
            return True
        except Exception as error:
            if attempt == max_attempts:
                print(f"[WARNING] Failed to generate cover image: {error}", file=sys.stderr)
                return False
            print(
                f"[WARNING] Cover image attempt {attempt}/{max_attempts} failed: {error}. Retrying...",
                file=sys.stderr,
            )
            time.sleep(10)


def list_available_models(api_key):
    """Debug helper: lists models this API key can access, for both text and image generation."""
    client = genai.Client(api_key=api_key)
    for m in client.models.list():
        actions = getattr(m, "supported_actions", None)
        print(m.name, actions if actions is not None else "")


# --------------------------------------------------------------------------
# Formatting
# --------------------------------------------------------------------------
def markdown_to_email_html(title, markdown_content):
    """Converts the AI-generated Markdown into simple, readable HTML for email."""
    body_html = md_lib.markdown(markdown_content, extensions=["extra", "sane_lists"])
    return f"""\
<html>
  <body style="font-family: Arial, Helvetica, sans-serif; line-height: 1.6; color: #1a1a1a; max-width: 700px; margin: 0 auto; padding: 16px;">
    <h1 style="color: #0176d3; font-size: 20px;">{title}</h1>
    {body_html}
    <hr style="border: none; border-top: 1px solid #ddd; margin: 24px 0;">
    <p style="font-size: 12px; color: #666;">
      Automatically sent by the Salesforce News Bot.
    </p>
  </body>
</html>
"""


# --------------------------------------------------------------------------
# Distribution - Telegram
# --------------------------------------------------------------------------
def _split_into_chunks(text, limit=4000):
    """Splits text into chunks respecting Telegram's character limit (4096)."""
    lines = text.split("\n")
    chunks, current = [], ""
    for line in lines:
        if len(current) + len(line) + 1 > limit:
            chunks.append(current)
            current = line
        else:
            current = f"{current}\n{line}" if current else line
    if current:
        chunks.append(current)
    return chunks


def send_telegram(markdown_content, token, chat_id):
    """Sends the summary to a Telegram chat/channel via the HTTP API."""
    url = f"https://api.telegram.org/bot{token}/sendMessage"
    for chunk in _split_into_chunks(markdown_content):
        response = requests.post(
            url,
            data={
                "chat_id": chat_id,
                "text": chunk,
                "parse_mode": "Markdown",
                "disable_web_page_preview": True,
            },
            timeout=HTTP_TIMEOUT,
        )
        if not response.ok:
            print(f"[WARNING] Failed to send message to Telegram: {response.text}", file=sys.stderr)


# --------------------------------------------------------------------------
# Distribution - Email (Gmail SMTP)
# --------------------------------------------------------------------------
def send_email(subject, markdown_content, sender, recipient, app_password):
    """Sends the summary by email via Gmail SMTP, in both plain text and HTML."""
    message = MIMEMultipart("alternative")
    message["Subject"] = subject
    message["From"] = sender
    message["To"] = recipient

    text_part = MIMEText(markdown_content, "plain", "utf-8")
    html_part = MIMEText(markdown_to_email_html(subject, markdown_content), "html", "utf-8")
    message.attach(text_part)
    message.attach(html_part)

    with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
        server.login(sender, app_password)
        server.sendmail(sender, recipient, message.as_string())


# --------------------------------------------------------------------------
# Persistence (editions/, README.md, commit + push to this same repo)
# --------------------------------------------------------------------------
def save_edition(date_str, markdown_content, cover_relative_path=None):
    """Saves the new edition's Markdown to editions/YYYY-MM-DD.md, with the cover on top if present."""
    editions_dir = "editions"
    os.makedirs(editions_dir, exist_ok=True)
    file_name = f"{date_str}.md"
    file_path = os.path.join(editions_dir, file_name)

    cover_markdown = f"![Cover]({os.path.basename(cover_relative_path)})\n\n" if cover_relative_path else ""
    header = cover_markdown + f"# Edição de {date_str} / Weekly Edition — {date_str}\n\n"
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(header + markdown_content + "\n")

    return f"editions/{file_name}"


def update_readme(date_str, markdown_content, relative_edition_path, cover_relative_path=None):
    """Replaces the block between the markers in README.md with the latest edition."""
    readme_path = "README.md"
    with open(readme_path, "r", encoding="utf-8") as f:
        readme_content = f.read()

    cover_markdown = f"![Cover]({cover_relative_path})\n\n" if cover_relative_path else ""
    new_block = (
        f"{MARKER_START}\n"
        f"### 🗓️ Edição de {date_str} / Weekly Edition {date_str}\n\n"
        f"{cover_markdown}"
        f"{markdown_content}\n\n"
        f"📄 [Ver esta edição no histórico / View this edition in the archive]({relative_edition_path})\n"
        f"{MARKER_END}"
    )

    pattern = re.compile(re.escape(MARKER_START) + r".*?" + re.escape(MARKER_END), re.DOTALL)
    if not pattern.search(readme_content):
        raise RuntimeError(f"Markers {MARKER_START} / {MARKER_END} not found in README.md.")

    updated_content = pattern.sub(new_block, readme_content)
    with open(readme_path, "w", encoding="utf-8") as f:
        f.write(updated_content)


def commit_and_push(date_str):
    subprocess.run(["git", "config", "user.name", "Salesforce News Bot"], check=True)
    subprocess.run(
        ["git", "config", "user.email", "salesforce-news-bot@users.noreply.github.com"], check=True
    )
    subprocess.run(["git", "add", "editions", "README.md"], check=True)
    result = subprocess.run(["git", "diff", "--cached", "--quiet"])
    if result.returncode == 0:
        print("[INFO] Nothing to commit.")
        return
    subprocess.run(["git", "commit", "-m", f"Weekly edition of {date_str}"], check=True)
    subprocess.run(["git", "push"], check=True)


def require_env(name):
    value = os.environ.get(name)
    if not value:
        print(f"[ERROR] Missing required environment variable: {name}", file=sys.stderr)
        sys.exit(1)
    return value


def is_dry_run():
    return os.environ.get("DRY_RUN", "false").strip().lower() in ("1", "true", "yes")


def is_skip_notifications():
    return os.environ.get("SKIP_NOTIFICATIONS", "false").strip().lower() in ("1", "true", "yes")


def is_biweekly_scheduled_week(reference_date=None):
    """GitHub Actions cron can't express "every 2 weeks" directly, so the workflow still
    fires every Monday and this gates it down to a biweekly cadence: only even ISO week
    numbers actually run. The parity is arbitrary — flip the "== 0" to "== 1" to shift
    which Mondays get skipped."""
    reference_date = reference_date or datetime.now(timezone.utc)
    return reference_date.isocalendar().week % 2 == 0


# --------------------------------------------------------------------------
# Main execution
# --------------------------------------------------------------------------
def main():
    if os.environ.get("GITHUB_EVENT_NAME") == "schedule" and not is_biweekly_scheduled_week():
        print("[INFO] Skipping this run — cadence is biweekly and this isn't a scheduled week.")
        return

    date_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    dry_run = is_dry_run()

    gemini_api_key = require_env("GEMINI_API_KEY")

    if os.environ.get("LIST_MODELS", "false").strip().lower() in ("1", "true", "yes"):
        list_available_models(gemini_api_key)
        return

    skip_notifications = is_skip_notifications()
    if not dry_run:
        if skip_notifications:
            print("[INFO] SKIP_NOTIFICATIONS is set — Telegram/email will not be sent.")
        else:
            telegram_token = require_env("TELEGRAM_TOKEN")
            telegram_chat_id = require_env("TELEGRAM_CHAT_ID")
            gmail_app_password = require_env("GMAIL_APP_PASSWORD")
            email_sender = require_env("EMAIL_REMETENTE")
            email_recipient = os.environ.get("EMAIL_DESTINATARIO", email_sender)

    print("[INFO] Loading sources...")
    sources = load_sources()
    if not sources:
        print("[ERROR] No sources found in sources.json.", file=sys.stderr)
        sys.exit(1)

    print(f"[INFO] Collecting content from {len(sources)} source(s)...")
    raw_content = collect_all_sources(sources)
    if not raw_content.strip():
        print("[ERROR] No content collected from the sources.", file=sys.stderr)
        sys.exit(1)

    print("[INFO] Generating summary with Gemini...")
    raw_summary = generate_summary(raw_content, gemini_api_key)
    summary_markdown, visual_themes = extract_visual_themes(raw_summary)
    print(f"[INFO] Visual themes for the cover: {visual_themes or '(none extracted)'}")

    if dry_run:
        print("[INFO] DRY RUN — no Telegram/email will be sent, nothing will be committed.")
        print("[INFO] Generating cover image with Pollinations...")
        cover_path = os.path.join(os.getcwd(), "dry_run_cover.jpg")
        cover_ok = generate_cover_image(visual_themes, cover_path)

        output_path = os.path.join(os.getcwd(), "dry_run_summary.md")
        with open(output_path, "w", encoding="utf-8") as f:
            f.write(summary_markdown)

        print("\n" + "=" * 80)
        print("DRY RUN OUTPUT")
        print("=" * 80 + "\n")
        print(summary_markdown)
        print(f"\n[SUCCESS] Dry run finished. Summary saved to {output_path}.")
        if cover_ok:
            print(f"[SUCCESS] Cover image saved to {cover_path}.")
        else:
            print("[WARNING] Cover image was not generated (see warning above).")
        return

    print("[INFO] Generating cover image with Pollinations...")
    os.makedirs("editions", exist_ok=True)
    cover_file_name = f"cover-{date_str}.jpg"
    cover_ok = generate_cover_image(visual_themes, os.path.join("editions", cover_file_name))
    cover_relative_path = f"editions/{cover_file_name}" if cover_ok else None

    if skip_notifications:
        print("[INFO] Skipping Telegram and email (SKIP_NOTIFICATIONS is set).")
    else:
        print("[INFO] Sending to Telegram...")
        send_telegram(summary_markdown, telegram_token, telegram_chat_id)

        print("[INFO] Sending email...")
        send_email(
            f"Salesforce News – Resumo Semanal / Weekly Summary ({date_str})",
            summary_markdown,
            email_sender,
            email_recipient,
            gmail_app_password,
        )

    print("[INFO] Saving edition and updating README...")
    edition_path = save_edition(date_str, summary_markdown, cover_relative_path)
    update_readme(date_str, summary_markdown, edition_path, cover_relative_path)

    print("[INFO] Publishing...")
    commit_and_push(date_str)

    print("[SUCCESS] Weekly edition published successfully.")


if __name__ == "__main__":
    main()
