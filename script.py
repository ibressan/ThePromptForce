"""
Main script for the Salesforce News Bot.

Flow:
  1. Clones the public repository (salesforce-news-community) using a PAT.
  2. Reads sources.json from the cloned repository and collects content (RSS and HTML).
  3. Sends the raw content to Gemini, which generates the bilingual (PT-BR + English)
     weekly summary.
  4. Distributes the summary via Telegram and email.
  5. Saves the new edition to editions/YYYY-MM-DD.md and updates README.md.
  6. Commits and pushes the changes back to the public repository.

Set DRY_RUN=true to only collect sources and generate the summary (printed to stdout
and saved to dry_run_summary.md) without sending Telegram/email or pushing anything.
In that mode, sources.json is read directly from the public repo over HTTPS (it's
public, so no PAT is needed) instead of via an authenticated clone.

All credentials are read exclusively from environment variables (os.environ).
No key, token or password should ever be hardcoded in this file.
"""

import json
import os
import re
import shutil
import smtplib
import subprocess
import sys
import tempfile
from datetime import datetime, timezone
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from urllib.parse import urlparse

import feedparser
import google.generativeai as genai
import markdown as md_lib
import requests
from bs4 import BeautifulSoup

from prompt import build_prompt

GEMINI_MODEL = "gemini-2.5-flash"

MAX_CHARS_PER_SOURCE = 4000
MAX_RSS_ENTRIES_PER_SOURCE = 5
HTTP_TIMEOUT = 15

MARKER_START = "<!-- SALESFORCE_NEWS_START -->"
MARKER_END = "<!-- SALESFORCE_NEWS_END -->"


# --------------------------------------------------------------------------
# Content ingestion
# --------------------------------------------------------------------------
def load_sources(sources_path):
    """Loads the list of sources from the public repository's sources.json (local file)."""
    with open(sources_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    return data.get("sources", [])


def github_owner_and_repo(repo_url):
    """Extracts (owner, repo) from a GitHub HTTPS URL such as https://github.com/owner/repo.git."""
    path = urlparse(repo_url).path.strip("/")
    if path.endswith(".git"):
        path = path[: -len(".git")]
    owner, repo = path.split("/", 1)
    return owner, repo


def fetch_public_sources(repo_url, branch="main"):
    """Reads sources.json directly from the public repo over HTTPS, without needing a PAT."""
    owner, repo = github_owner_and_repo(repo_url)
    raw_url = f"https://raw.githubusercontent.com/{owner}/{repo}/{branch}/sources.json"
    response = requests.get(raw_url, timeout=HTTP_TIMEOUT)
    response.raise_for_status()
    return json.loads(response.text).get("sources", [])


def collect_rss(name, url):
    """Extracts the most recent entries from an RSS/Atom feed."""
    feed = feedparser.parse(url)
    parts = []
    for entry in feed.entries[:MAX_RSS_ENTRIES_PER_SOURCE]:
        title = entry.get("title", "").strip()
        link = entry.get("link", "").strip()
        summary_html = entry.get("summary", "") or entry.get("description", "")
        summary_text = BeautifulSoup(summary_html, "html.parser").get_text(" ", strip=True)
        parts.append(f"### {title}\nLink: {link}\n{summary_text}")
    return "\n\n".join(parts)[:MAX_CHARS_PER_SOURCE]


def collect_html(name, url):
    """Does simple scraping of a page that has no RSS feed available."""
    response = requests.get(url, timeout=HTTP_TIMEOUT, headers={"User-Agent": "Mozilla/5.0"})
    response.raise_for_status()
    soup = BeautifulSoup(response.text, "html.parser")
    for tag in soup(["script", "style", "nav", "footer", "header"]):
        tag.decompose()
    text = soup.get_text(" ", strip=True)
    return text[:MAX_CHARS_PER_SOURCE]


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
def generate_summary(raw_content, api_key):
    """Calls the Gemini API to generate the bilingual (PT-BR + English) weekly summary."""
    genai.configure(api_key=api_key)
    model = genai.GenerativeModel(GEMINI_MODEL)
    final_prompt = build_prompt(raw_content)
    response = model.generate_content(final_prompt)
    return response.text.strip()


def list_available_models(api_key):
    """Debug helper: lists the Gemini models this API key can call generate_content on."""
    genai.configure(api_key=api_key)
    for m in genai.list_models():
        if "generateContent" in m.supported_generation_methods:
            print(m.name)


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
# Persistence in the public repository (clone, editions/, README.md, push)
# --------------------------------------------------------------------------
def authenticated_url(repo_url, token):
    """Injects the PAT into the repository's HTTPS URL to allow authenticated clone/push."""
    parts = urlparse(repo_url)
    return parts._replace(netloc=f"x-access-token:{token}@{parts.netloc}").geturl()


def clone_public_repo(destination, repo_url, token):
    url_with_token = authenticated_url(repo_url, token)
    subprocess.run(["git", "clone", "--depth", "1", url_with_token, destination], check=True)
    subprocess.run(["git", "-C", destination, "config", "user.name", "Salesforce News Bot"], check=True)
    subprocess.run(
        ["git", "-C", destination, "config", "user.email", "salesforce-news-bot@users.noreply.github.com"],
        check=True,
    )


def save_edition(repo_path, date_str, markdown_content):
    """Saves the new edition's Markdown to editions/YYYY-MM-DD.md."""
    editions_dir = os.path.join(repo_path, "editions")
    os.makedirs(editions_dir, exist_ok=True)
    file_name = f"{date_str}.md"
    file_path = os.path.join(editions_dir, file_name)

    header = f"# Edição de {date_str} / Weekly Edition — {date_str}\n\n"
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(header + markdown_content + "\n")

    return f"editions/{file_name}"


def update_readme(repo_path, date_str, markdown_content, relative_edition_path):
    """Replaces the block between the markers in README.md with the latest edition."""
    readme_path = os.path.join(repo_path, "README.md")
    with open(readme_path, "r", encoding="utf-8") as f:
        readme_content = f.read()

    new_block = (
        f"{MARKER_START}\n"
        f"### 🗓️ Edição de {date_str} / Weekly Edition {date_str}\n\n"
        f"{markdown_content}\n\n"
        f"📄 [Ver esta edição no histórico / View this edition in the archive]({relative_edition_path})\n"
        f"{MARKER_END}"
    )

    pattern = re.compile(re.escape(MARKER_START) + r".*?" + re.escape(MARKER_END), re.DOTALL)
    if not pattern.search(readme_content):
        raise RuntimeError(
            f"Markers {MARKER_START} / {MARKER_END} not found in the public repository's README.md."
        )

    updated_content = pattern.sub(new_block, readme_content)
    with open(readme_path, "w", encoding="utf-8") as f:
        f.write(updated_content)


def commit_and_push(repo_path, date_str):
    subprocess.run(["git", "-C", repo_path, "add", "editions", "README.md"], check=True)
    result = subprocess.run(["git", "-C", repo_path, "diff", "--cached", "--quiet"])
    if result.returncode == 0:
        print("[INFO] Nothing to commit.")
        return
    subprocess.run(
        ["git", "-C", repo_path, "commit", "-m", f"Weekly edition of {date_str}"],
        check=True,
    )
    subprocess.run(["git", "-C", repo_path, "push"], check=True)


def require_env(name):
    value = os.environ.get(name)
    if not value:
        print(f"[ERROR] Missing required environment variable: {name}", file=sys.stderr)
        sys.exit(1)
    return value


def is_dry_run():
    return os.environ.get("DRY_RUN", "false").strip().lower() in ("1", "true", "yes")


# --------------------------------------------------------------------------
# Main execution
# --------------------------------------------------------------------------
def main():
    date_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    dry_run = is_dry_run()

    gemini_api_key = require_env("GEMINI_API_KEY")
    public_repo_url = require_env("PUBLIC_REPO_URL")

    if os.environ.get("LIST_MODELS", "false").strip().lower() in ("1", "true", "yes"):
        list_available_models(gemini_api_key)
        return

    if dry_run:
        print("[INFO] DRY RUN — no Telegram/email will be sent, nothing will be pushed.")
        print("[INFO] Fetching sources.json directly from the public repo (no PAT needed)...")
        sources = fetch_public_sources(public_repo_url)
        if not sources:
            print("[ERROR] No sources found in sources.json.", file=sys.stderr)
            sys.exit(1)

        print(f"[INFO] Collecting content from {len(sources)} source(s)...")
        raw_content = collect_all_sources(sources)
        if not raw_content.strip():
            print("[ERROR] No content collected from the sources.", file=sys.stderr)
            sys.exit(1)

        print("[INFO] Generating summary with Gemini...")
        summary_markdown = generate_summary(raw_content, gemini_api_key)

        output_path = os.path.join(os.getcwd(), "dry_run_summary.md")
        with open(output_path, "w", encoding="utf-8") as f:
            f.write(summary_markdown)

        print("\n" + "=" * 80)
        print("DRY RUN OUTPUT")
        print("=" * 80 + "\n")
        print(summary_markdown)
        print(f"\n[SUCCESS] Dry run finished. Summary saved to {output_path}.")
        return

    telegram_token = require_env("TELEGRAM_TOKEN")
    telegram_chat_id = require_env("TELEGRAM_CHAT_ID")
    gmail_app_password = require_env("GMAIL_APP_PASSWORD")
    email_sender = require_env("EMAIL_REMETENTE")
    email_recipient = os.environ.get("EMAIL_DESTINATARIO", email_sender)
    pat_github = require_env("PAT_GITHUB")

    public_repo_dir = tempfile.mkdtemp(prefix="salesforce-news-community-")
    try:
        print("[INFO] Cloning public repository...")
        clone_public_repo(public_repo_dir, public_repo_url, pat_github)

        print("[INFO] Loading sources...")
        sources = load_sources(os.path.join(public_repo_dir, "sources.json"))
        if not sources:
            print("[ERROR] No sources found in sources.json.", file=sys.stderr)
            sys.exit(1)

        print(f"[INFO] Collecting content from {len(sources)} source(s)...")
        raw_content = collect_all_sources(sources)
        if not raw_content.strip():
            print("[ERROR] No content collected from the sources.", file=sys.stderr)
            sys.exit(1)

        print("[INFO] Generating summary with Gemini...")
        summary_markdown = generate_summary(raw_content, gemini_api_key)

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
        edition_path = save_edition(public_repo_dir, date_str, summary_markdown)
        update_readme(public_repo_dir, date_str, summary_markdown, edition_path)

        print("[INFO] Publishing to the public repository...")
        commit_and_push(public_repo_dir, date_str)

        print("[SUCCESS] Weekly edition published successfully.")
    finally:
        shutil.rmtree(public_repo_dir, ignore_errors=True)


if __name__ == "__main__":
    main()
