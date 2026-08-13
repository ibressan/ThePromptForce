"""
Main script for the Salesforce News bot.

This repository is self-contained: the automation code and the generated content
(sources.json, editions/, README.md) live in the same public repo, so the workflow
just checks the repo out, runs this script, and pushes back to itself — no separate
repo, PAT, or cross-repo clone involved.

Flow:
  1. Reads sources.json (repo root) and collects content (RSS and HTML), including each
     article's own image (og:image / media thumbnail / first inline <img>).
  2. Sends the raw content to Gemini, which generates the bilingual (PT-BR + English)
     weekly summary and picks one of those image URLs to use as the edition's cover.
  3. Distributes the summary via Telegram and email.
  4. Saves the new edition to editions/YYYY-MM-DD.md (with the cover) and updates README.md.
  5. Commits and pushes the changes.

The cover is always a URL pointing back at the original article's image — nothing is
generated or saved locally, so there's no image storage/hosting to maintain.

Set DRY_RUN=true to only collect sources and generate the summary (saved locally as
dry_run_summary.md) without sending Telegram/email or committing/pushing anything.

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

import feedparser
import markdown as md_lib
import requests
from bs4 import BeautifulSoup
from google import genai

from prompt import build_prompt

GEMINI_MODEL = "gemini-flash-latest"

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


def extract_rss_entry_image(entry):
    """Best-effort extraction of an RSS/Atom entry's own illustrative image, checked in
    order of reliability: standard media extensions, enclosure links, then the first
    <img> inline in the summary/content HTML. Returns None if nothing is found."""
    media_content = entry.get("media_content") or []
    for media in media_content:
        if media.get("url"):
            return media["url"]

    media_thumbnail = entry.get("media_thumbnail") or []
    for media in media_thumbnail:
        if media.get("url"):
            return media["url"]

    for link in entry.get("links", []) or []:
        if str(link.get("rel")) == "enclosure" and str(link.get("type", "")).startswith("image/"):
            return link.get("href")

    html_blob = entry.get("summary", "") or entry.get("description", "")
    for content_entry in entry.get("content", []) or []:
        html_blob += content_entry.get("value", "")
    img_tag = BeautifulSoup(html_blob, "html.parser").find("img")
    if img_tag and img_tag.get("src"):
        return img_tag["src"]

    return None


def extract_html_page_image(soup):
    """Best-effort extraction of a scraped page's own image: og:image meta tag first
    (most reliable, used by virtually every modern blog for link previews), falling back
    to the first sizable inline <img>. Returns None if nothing is found."""
    og_image = soup.find("meta", property="og:image")
    if og_image and og_image.get("content"):
        return og_image["content"]

    img_tag = soup.find("img", src=True)
    if img_tag:
        return img_tag["src"]

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
        image_url = extract_rss_entry_image(entry) or "none"
        parts.append(
            f"### {title}\nPublished: {date_label}\nLink: {link}\nImage: {image_url}\n{summary_text}"
        )
    return "\n\n".join(parts)[:MAX_CHARS_PER_SOURCE]


def collect_html(name, url):
    """Does simple scraping of a page that has no RSS feed available.

    There's no structured per-article publish date here (just a raw page scrape), so the
    date is marked as unknown to prevent the model from inventing one.
    """
    response = requests.get(url, timeout=HTTP_TIMEOUT, headers={"User-Agent": "Mozilla/5.0"})
    response.raise_for_status()
    soup = BeautifulSoup(response.text, "html.parser")
    image_url = extract_html_page_image(soup) or "none"
    for tag in soup(["script", "style", "nav", "footer", "header"]):
        tag.decompose()
    text = soup.get_text(" ", strip=True)
    return f"Published: unknown\nLink: {url}\nImage: {image_url}\n{text}"[:MAX_CHARS_PER_SOURCE]


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
    followed by a COVER_IMAGE line (see extract_cover_image).

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


def extract_cover_image(raw_summary, raw_content):
    """Splits off the trailing 'COVER_IMAGE: url' line from the generated summary.

    Returns (summary_markdown, cover_image_url_or_None). The URL is only trusted if it
    literally appears in the raw content collected from the sources — this guards
    against the model hallucinating a URL instead of picking one that was actually
    offered to it.
    """
    match = re.search(r"^COVER_IMAGE:\s*(.+)$", raw_summary, re.MULTILINE)
    summary_markdown = (
        raw_summary[: match.start()].rstrip() if match else raw_summary.strip()
    )
    if not match:
        return summary_markdown, None

    cover_url = match.group(1).strip()
    if cover_url.lower() == "none" or cover_url not in raw_content:
        return summary_markdown, None
    return summary_markdown, cover_url


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
      Automatically sent by The Prompt Force Bot.
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
def save_edition(date_str, markdown_content, cover_image_url=None):
    """Saves the new edition's Markdown to editions/YYYY-MM-DD.md, with the cover on top
    if present. The cover is always an external URL pointing back at the original
    article's own image — nothing is downloaded or stored in this repo."""
    editions_dir = "editions"
    os.makedirs(editions_dir, exist_ok=True)
    file_name = f"{date_str}.md"
    file_path = os.path.join(editions_dir, file_name)

    cover_markdown = f"![Cover]({cover_image_url})\n\n" if cover_image_url else ""
    header = cover_markdown + f"# Edição de {date_str} / Weekly Edition — {date_str}\n\n"
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(header + markdown_content + "\n")

    update_editions_index(editions_dir)

    return f"editions/{file_name}"


def update_editions_index(editions_dir="editions"):
    """Regenerates editions/index.json — a flat list of edition dates, newest
    first. The site's frontend reads this instead of the GitHub Contents API
    to list editions, since that API is rate-limited to 60 unauthenticated
    requests/hour per client IP (shared by every visitor behind the same
    NAT/proxy) and starts failing site-wide once exhausted; a static JSON
    file served from raw.githubusercontent.com has no such limit."""
    dates = sorted(
        (
            name[:-3]
            for name in os.listdir(editions_dir)
            if re.fullmatch(r"\d{4}-\d{2}-\d{2}\.md", name)
        ),
        reverse=True,
    )
    index_path = os.path.join(editions_dir, "index.json")
    with open(index_path, "w", encoding="utf-8") as f:
        json.dump({"editions": dates}, f, indent=2)
        f.write("\n")


def update_readme(date_str, markdown_content, relative_edition_path, cover_image_url=None):
    """Replaces the block between the markers in README.md with the latest edition."""
    readme_path = "README.md"
    with open(readme_path, "r", encoding="utf-8") as f:
        readme_content = f.read()

    cover_markdown = f"![Cover]({cover_image_url})\n\n" if cover_image_url else ""
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
    subprocess.run(["git", "config", "user.name", "The Prompt Force Bot"], check=True)
    subprocess.run(
        ["git", "config", "user.email", "prompt-force-bot@users.noreply.github.com"], check=True
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


# --------------------------------------------------------------------------
# Main execution
# --------------------------------------------------------------------------
def main():
    date_str = (
        os.environ.get("REGENERATE_DATE", "").strip()
        or datetime.now(timezone.utc).strftime("%Y-%m-%d")
    )
    dry_run = is_dry_run()

    gemini_api_key = require_env("GEMINI_API_KEY")

    if os.environ.get("LIST_MODELS", "false").strip().lower() in ("1", "true", "yes"):
        list_available_models(gemini_api_key)
        return

    skip_notifications = is_skip_notifications()
    telegram_token = telegram_chat_id = gmail_app_password = email_sender = email_recipient = None
    if not dry_run:
        if skip_notifications:
            print("[INFO] SKIP_NOTIFICATIONS is set — Telegram/email will not be sent.")
        else:
            telegram_token = os.environ.get("TELEGRAM_TOKEN", "").strip() or None
            telegram_chat_id = os.environ.get("TELEGRAM_CHAT_ID", "").strip() or None
            gmail_app_password = os.environ.get("GMAIL_APP_PASSWORD", "").strip() or None
            email_sender = os.environ.get("EMAIL_REMETENTE", "").strip() or None
            email_recipient = os.environ.get("EMAIL_DESTINATARIO", "").strip() or email_sender
            if not telegram_token:
                print("[INFO] TELEGRAM_TOKEN not set — Telegram notifications will be skipped.")
            if not gmail_app_password:
                print("[INFO] GMAIL_APP_PASSWORD not set — email notifications will be skipped.")

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
    summary_markdown, cover_image_url = extract_cover_image(raw_summary, raw_content)
    print(f"[INFO] Cover image: {cover_image_url or '(none chosen)'}")

    if dry_run:
        print("[INFO] DRY RUN — no Telegram/email will be sent, nothing will be committed.")
        output_path = os.path.join(os.getcwd(), "dry_run_summary.md")
        with open(output_path, "w", encoding="utf-8") as f:
            f.write(summary_markdown)

        print("\n" + "=" * 80)
        print("DRY RUN OUTPUT")
        print("=" * 80 + "\n")
        print(summary_markdown)
        print(f"\n[SUCCESS] Dry run finished. Summary saved to {output_path}.")
        return

    if skip_notifications:
        print("[INFO] Skipping Telegram and email (SKIP_NOTIFICATIONS is set).")
    else:
        if telegram_token and telegram_chat_id:
            print("[INFO] Sending to Telegram...")
            send_telegram(summary_markdown, telegram_token, telegram_chat_id)
        else:
            print("[INFO] Skipping Telegram (credentials not configured).")

        if gmail_app_password and email_sender:
            print("[INFO] Sending email...")
            send_email(
                f"Salesforce News – Resumo Semanal / Weekly Summary ({date_str})",
                summary_markdown,
                email_sender,
                email_recipient,
                gmail_app_password,
            )
        else:
            print("[INFO] Skipping email (credentials not configured).")

    print("[INFO] Saving edition and updating README...")
    edition_path = save_edition(date_str, summary_markdown, cover_image_url)
    update_readme(date_str, summary_markdown, edition_path, cover_image_url)

    print("[INFO] Publishing...")
    commit_and_push(date_str)

    print("[SUCCESS] Weekly edition published successfully.")


if __name__ == "__main__":
    main()
