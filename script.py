"""
Script principal do Salesforce News Bot.

Fluxo:
  1. Clona o repositório público (salesforce-news-community) usando um PAT.
  2. Lê fontes.json do repositório clonado e coleta conteúdo (RSS e HTML).
  3. Envia o conteúdo bruto para o Gemini, que gera o resumo semanal em PT-BR.
  4. Distribui o resumo via Telegram e e-mail.
  5. Salva a nova edição em edicoes/YYYY-MM-DD.md e atualiza o README.md.
  6. Faz commit e push das mudanças de volta para o repositório público.

Todas as credenciais são lidas exclusivamente de variáveis de ambiente (os.environ).
Nenhuma chave, token ou senha deve ser hardcoded neste arquivo.
"""

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

from prompt import montar_prompt

# --------------------------------------------------------------------------
# Configuração via variáveis de ambiente (nunca hardcode segredos aqui)
# --------------------------------------------------------------------------
GEMINI_API_KEY = os.environ["GEMINI_API_KEY"]
TELEGRAM_TOKEN = os.environ["TELEGRAM_TOKEN"]
TELEGRAM_CHAT_ID = os.environ["TELEGRAM_CHAT_ID"]
GMAIL_APP_PASSWORD = os.environ["GMAIL_APP_PASSWORD"]
EMAIL_REMETENTE = os.environ["EMAIL_REMETENTE"]
# Se não houver um destinatário específico, o e-mail é enviado para o próprio remetente.
EMAIL_DESTINATARIO = os.environ.get("EMAIL_DESTINATARIO", EMAIL_REMETENTE)
PAT_GITHUB = os.environ["PAT_GITHUB"]
PUBLIC_REPO_URL = os.environ["PUBLIC_REPO_URL"]

GEMINI_MODEL = "gemini-2.5-flash"

MAX_CHARS_POR_FONTE = 4000
MAX_ENTRADAS_RSS_POR_FONTE = 5
TIMEOUT_HTTP = 15

MARCADOR_INICIO = "<!-- SALESFORCE_NEWS_START -->"
MARCADOR_FIM = "<!-- SALESFORCE_NEWS_END -->"


# --------------------------------------------------------------------------
# Ingestão de conteúdo
# --------------------------------------------------------------------------
def carregar_fontes(caminho_fontes):
    """Carrega a lista de fontes a partir do fontes.json do repositório público."""
    import json

    with open(caminho_fontes, "r", encoding="utf-8") as f:
        dados = json.load(f)
    return dados.get("fontes", [])


def coletar_rss(nome, url):
    """Extrai as entradas mais recentes de um feed RSS/Atom."""
    feed = feedparser.parse(url)
    partes = []
    for entrada in feed.entries[:MAX_ENTRADAS_RSS_POR_FONTE]:
        titulo = entrada.get("title", "").strip()
        link = entrada.get("link", "").strip()
        resumo_html = entrada.get("summary", "") or entrada.get("description", "")
        resumo_texto = BeautifulSoup(resumo_html, "html.parser").get_text(" ", strip=True)
        partes.append(f"### {titulo}\nLink: {link}\n{resumo_texto}")
    return "\n\n".join(partes)[:MAX_CHARS_POR_FONTE]


def coletar_html(nome, url):
    """Faz scraping simples de uma página sem feed RSS disponível."""
    resposta = requests.get(url, timeout=TIMEOUT_HTTP, headers={"User-Agent": "Mozilla/5.0"})
    resposta.raise_for_status()
    sopa = BeautifulSoup(resposta.text, "html.parser")
    for tag in sopa(["script", "style", "nav", "footer", "header"]):
        tag.decompose()
    texto = sopa.get_text(" ", strip=True)
    return texto[:MAX_CHARS_POR_FONTE]


def coletar_todas_fontes(fontes):
    """Coleta o conteúdo de todas as fontes, ignorando falhas individuais sem interromper o fluxo."""
    blocos = []
    for fonte in fontes:
        nome = fonte.get("nome", "Fonte sem nome")
        url = fonte.get("url")
        tipo = fonte.get("tipo", "rss")
        try:
            if tipo == "rss":
                conteudo = coletar_rss(nome, url)
            else:
                conteudo = coletar_html(nome, url)
            if conteudo:
                blocos.append(f"## Fonte: {nome} ({url})\n{conteudo}")
        except Exception as erro:
            print(f"[AVISO] Falha ao coletar '{nome}' ({url}): {erro}", file=sys.stderr)
    return "\n\n".join(blocos)


# --------------------------------------------------------------------------
# Geração do resumo com Gemini
# --------------------------------------------------------------------------
def gerar_resumo(conteudo_bruto):
    """Chama a API do Gemini para gerar o resumo semanal em Markdown, em PT-BR."""
    genai.configure(api_key=GEMINI_API_KEY)
    modelo = genai.GenerativeModel(GEMINI_MODEL)
    prompt_final = montar_prompt(conteudo_bruto)
    resposta = modelo.generate_content(prompt_final)
    return resposta.text.strip()


# --------------------------------------------------------------------------
# Formatação
# --------------------------------------------------------------------------
def markdown_para_html_email(titulo, conteudo_markdown):
    """Converte o Markdown gerado pela IA em um HTML simples e legível para e-mail."""
    corpo_html = md_lib.markdown(conteudo_markdown, extensions=["extra", "sane_lists"])
    return f"""\
<html>
  <body style="font-family: Arial, Helvetica, sans-serif; line-height: 1.6; color: #1a1a1a; max-width: 700px; margin: 0 auto; padding: 16px;">
    <h1 style="color: #0176d3; font-size: 20px;">{titulo}</h1>
    {corpo_html}
    <hr style="border: none; border-top: 1px solid #ddd; margin: 24px 0;">
    <p style="font-size: 12px; color: #666;">
      Enviado automaticamente pelo Salesforce News Bot.
    </p>
  </body>
</html>
"""


# --------------------------------------------------------------------------
# Distribuição - Telegram
# --------------------------------------------------------------------------
def _dividir_em_blocos(texto, limite=4000):
    """Divide o texto em blocos respeitando o limite de caracteres do Telegram (4096)."""
    linhas = texto.split("\n")
    blocos, atual = [], ""
    for linha in linhas:
        if len(atual) + len(linha) + 1 > limite:
            blocos.append(atual)
            atual = linha
        else:
            atual = f"{atual}\n{linha}" if atual else linha
    if atual:
        blocos.append(atual)
    return blocos


def enviar_telegram(conteudo_markdown):
    """Envia o resumo para um chat/canal do Telegram via API HTTP."""
    url = f"https://api.telegram.org/bot{TELEGRAM_TOKEN}/sendMessage"
    for bloco in _dividir_em_blocos(conteudo_markdown):
        resposta = requests.post(
            url,
            data={
                "chat_id": TELEGRAM_CHAT_ID,
                "text": bloco,
                "parse_mode": "Markdown",
                "disable_web_page_preview": True,
            },
            timeout=TIMEOUT_HTTP,
        )
        if not resposta.ok:
            print(f"[AVISO] Falha ao enviar mensagem ao Telegram: {resposta.text}", file=sys.stderr)


# --------------------------------------------------------------------------
# Distribuição - E-mail (Gmail SMTP)
# --------------------------------------------------------------------------
def enviar_email(assunto, conteudo_markdown):
    """Envia o resumo por e-mail via SMTP do Gmail, em texto simples e HTML."""
    mensagem = MIMEMultipart("alternative")
    mensagem["Subject"] = assunto
    mensagem["From"] = EMAIL_REMETENTE
    mensagem["To"] = EMAIL_DESTINATARIO

    parte_texto = MIMEText(conteudo_markdown, "plain", "utf-8")
    parte_html = MIMEText(markdown_para_html_email(assunto, conteudo_markdown), "html", "utf-8")
    mensagem.attach(parte_texto)
    mensagem.attach(parte_html)

    with smtplib.SMTP_SSL("smtp.gmail.com", 465) as servidor:
        servidor.login(EMAIL_REMETENTE, GMAIL_APP_PASSWORD)
        servidor.sendmail(EMAIL_REMETENTE, EMAIL_DESTINATARIO, mensagem.as_string())


# --------------------------------------------------------------------------
# Persistência no repositório público (clone, edicoes/, README.md, push)
# --------------------------------------------------------------------------
def url_autenticada(repo_url, token):
    """Injeta o PAT na URL HTTPS do repositório para permitir clone/push autenticado."""
    partes = urlparse(repo_url)
    return partes._replace(netloc=f"x-access-token:{token}@{partes.netloc}").geturl()


def clonar_repo_publico(destino):
    url_com_token = url_autenticada(PUBLIC_REPO_URL, PAT_GITHUB)
    subprocess.run(["git", "clone", "--depth", "1", url_com_token, destino], check=True)
    subprocess.run(["git", "-C", destino, "config", "user.name", "Salesforce News Bot"], check=True)
    subprocess.run(
        ["git", "-C", destino, "config", "user.email", "salesforce-news-bot@users.noreply.github.com"],
        check=True,
    )


def salvar_edicao(repo_path, data_str, conteudo_markdown):
    """Salva o Markdown da nova edição em edicoes/YYYY-MM-DD.md."""
    pasta_edicoes = os.path.join(repo_path, "edicoes")
    os.makedirs(pasta_edicoes, exist_ok=True)
    nome_arquivo = f"{data_str}.md"
    caminho_arquivo = os.path.join(pasta_edicoes, nome_arquivo)

    cabecalho = f"# Edição de {data_str}\n\n"
    with open(caminho_arquivo, "w", encoding="utf-8") as f:
        f.write(cabecalho + conteudo_markdown + "\n")

    return f"edicoes/{nome_arquivo}"


def atualizar_readme(repo_path, data_str, conteudo_markdown, caminho_relativo_edicao):
    """Substitui o bloco entre os marcadores no README.md pela edição mais recente."""
    caminho_readme = os.path.join(repo_path, "README.md")
    with open(caminho_readme, "r", encoding="utf-8") as f:
        conteudo_readme = f.read()

    novo_bloco = (
        f"{MARCADOR_INICIO}\n"
        f"### 🗓️ Edição de {data_str}\n\n"
        f"{conteudo_markdown}\n\n"
        f"📄 [Ver esta edição no histórico]({caminho_relativo_edicao})\n"
        f"{MARCADOR_FIM}"
    )

    padrao = re.compile(
        re.escape(MARCADOR_INICIO) + r".*?" + re.escape(MARCADOR_FIM), re.DOTALL
    )
    if not padrao.search(conteudo_readme):
        raise RuntimeError(
            f"Marcadores {MARCADOR_INICIO} / {MARCADOR_FIM} não encontrados no README.md do repositório público."
        )

    conteudo_atualizado = padrao.sub(novo_bloco, conteudo_readme)
    with open(caminho_readme, "w", encoding="utf-8") as f:
        f.write(conteudo_atualizado)


def commit_e_push(repo_path, data_str):
    subprocess.run(["git", "-C", repo_path, "add", "edicoes", "README.md"], check=True)
    resultado = subprocess.run(
        ["git", "-C", repo_path, "diff", "--cached", "--quiet"]
    )
    if resultado.returncode == 0:
        print("[INFO] Nenhuma mudança para commitar.")
        return
    subprocess.run(
        ["git", "-C", repo_path, "commit", "-m", f"Edição semanal de {data_str}"],
        check=True,
    )
    subprocess.run(["git", "-C", repo_path, "push"], check=True)


# --------------------------------------------------------------------------
# Execução principal
# --------------------------------------------------------------------------
def main():
    data_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    repo_publico = tempfile.mkdtemp(prefix="salesforce-news-community-")

    try:
        print("[INFO] Clonando repositório público...")
        clonar_repo_publico(repo_publico)

        print("[INFO] Carregando fontes...")
        fontes = carregar_fontes(os.path.join(repo_publico, "fontes.json"))
        if not fontes:
            print("[ERRO] Nenhuma fonte encontrada em fontes.json.", file=sys.stderr)
            sys.exit(1)

        print(f"[INFO] Coletando conteúdo de {len(fontes)} fonte(s)...")
        conteudo_bruto = coletar_todas_fontes(fontes)
        if not conteudo_bruto.strip():
            print("[ERRO] Nenhum conteúdo coletado das fontes.", file=sys.stderr)
            sys.exit(1)

        print("[INFO] Gerando resumo com Gemini...")
        resumo_markdown = gerar_resumo(conteudo_bruto)

        print("[INFO] Enviando para o Telegram...")
        enviar_telegram(resumo_markdown)

        print("[INFO] Enviando e-mail...")
        enviar_email(f"Salesforce News - Resumo Semanal ({data_str})", resumo_markdown)

        print("[INFO] Salvando edição e atualizando README...")
        caminho_edicao = salvar_edicao(repo_publico, data_str, resumo_markdown)
        atualizar_readme(repo_publico, data_str, resumo_markdown, caminho_edicao)

        print("[INFO] Publicando no repositório público...")
        commit_e_push(repo_publico, data_str)

        print("[SUCESSO] Edição semanal publicada com sucesso.")
    finally:
        shutil.rmtree(repo_publico, ignore_errors=True)


if __name__ == "__main__":
    main()
