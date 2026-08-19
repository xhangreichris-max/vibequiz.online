#!/usr/bin/env python3
"""Static site builder for vibequiz.online.

Reads quizzes-config.json, renders each quiz page from template.html and the
homepage from template_index.html, then emits sitemap.xml and robots.txt.
Everything is written into dist/. Stdlib only — no dependencies required to
run this script.
"""

import html
import json
import os
import shutil
from datetime import date

ROOT = os.path.dirname(os.path.abspath(__file__))
DIST = os.path.join(ROOT, "dist")


def esc(value):
    return html.escape(str(value), quote=True)


def load_config():
    with open(os.path.join(ROOT, "quizzes-config.json"), "r", encoding="utf-8") as f:
        return json.load(f)


def read_template(name):
    with open(os.path.join(ROOT, name), "r", encoding="utf-8") as f:
        return f.read()


def fill(template, tokens):
    out = template
    for key, value in tokens.items():
        placeholder = "{{" + key + "}}"
        if placeholder not in out:
            raise ValueError(f"template missing placeholder {placeholder}")
        out = out.replace(placeholder, value)
    remaining = [seg for seg in out.split("{{")[1:] if "}}" in seg]
    if remaining:
        leftover = remaining[0].split("}}")[0]
        raise ValueError("unsubstituted placeholder left in output: {{" + leftover + "}}")
    return out


# --------------------------------------------------------------------------
# Section renderers (pre-rendered raw HTML, crawlable with JS disabled)
# --------------------------------------------------------------------------

def render_article(article):
    parts = ["<h2>About This Quiz</h2>"]
    for section in article:
        parts.append(f"<h3>{esc(section['heading'])}</h3>")
        parts.append(f"<p>{esc(section['body'])}</p>")
    return "\n".join(parts)


def render_all_results(results):
    parts = []
    for rid, result in results.items():
        parts.append('<div class="all-results-item">')
        parts.append(f"<h3>{esc(result['name'])}</h3>")
        parts.append(f'<p class="all-results-verdict">{esc(result["verdict"])}</p>')
        parts.append(f'<p id="ar-desc-{esc(rid)}">{esc(result["description"])}</p>')
        parts.append("</div>")
    return "\n".join(parts)


def render_faq(faq):
    parts = []
    for item in faq:
        parts.append('<div class="faq-item">')
        parts.append(f"<h3>{esc(item['question'])}</h3>")
        parts.append(f"<p>{esc(item['answer'])}</p>")
        parts.append("</div>")
    return "\n".join(parts)


# --------------------------------------------------------------------------
# JSON-LD
# --------------------------------------------------------------------------

def build_quiz_json_ld(quiz, canonical_url):
    faq_entities = [
        {
            "@type": "Question",
            "name": item["question"],
            "acceptedAnswer": {"@type": "Answer", "text": item["answer"]},
        }
        for item in quiz["faq"]
    ]
    graph = [
        {
            "@type": "Quiz",
            "name": quiz["title"],
            "description": quiz["meta_description"],
            "url": canonical_url,
            "about": quiz["h1"],
        },
        {
            "@type": "FAQPage",
            "mainEntity": faq_entities,
        },
    ]
    return json.dumps({"@context": "https://schema.org", "@graph": graph}, ensure_ascii=False)


def build_site_json_ld(site):
    return json.dumps(
        {"@context": "https://schema.org", "@type": "WebSite", "name": site["name"], "url": site["base_url"]},
        ensure_ascii=False,
    )


# --------------------------------------------------------------------------
# Quiz-data JSON (slim — questions/weights + result palette/signals/
# fragments/verdict. Full descriptions are deliberately excluded; the
# interactive result screen reads full description text out of the
# pre-rendered #all-results section at runtime instead of duplicating it here)
# --------------------------------------------------------------------------

def build_quiz_data(quiz):
    slim_results = {}
    for rid, result in quiz["results"].items():
        slim_results[rid] = {
            "name": result["name"],
            "emoji": result["emoji"],
            "palette": result["palette"],
            "signals": result["signals"],
            "fragments": result["fragments"],
            "verdict": result["verdict"],
        }
    return json.dumps(
        {"slug": quiz["slug"], "questions": quiz["questions"], "results": slim_results},
        ensure_ascii=False,
    )


# --------------------------------------------------------------------------
# Footer links (same 5, every page)
# --------------------------------------------------------------------------

FOOTER_LABELS = {
    "aesthetic-quiz": "Aesthetic",
    "aesthetic-quiz-clothing": "Clothing",
    "what-food-am-i": "Food",
    "what-bird-am-i": "Bird",
    "what-dessert-am-i": "Dessert",
}


def render_footer_links(quizzes):
    parts = []
    for quiz in quizzes:
        label = FOOTER_LABELS.get(quiz["slug"], quiz["card_title"])
        parts.append(f'<a href="/{esc(quiz["slug"])}/index.html">{esc(label)}</a>')
    return "\n".join(parts)


# --------------------------------------------------------------------------
# Homepage cards
# --------------------------------------------------------------------------

def render_flagship_card(quiz):
    subtitle = f"{quiz['results_label']} · {len(quiz['questions'])} questions"
    return (
        f'<a href="/{esc(quiz["slug"])}/index.html" class="flagship-card">'
        f'<div class="quiz-title">{esc(quiz["card_title"])}</div>'
        f'<div class="quiz-subtitle">{esc(subtitle)}</div>'
        f'<div class="quiz-cta">TAKE THE QUIZ →</div>'
        f"</a>"
    )


def render_secondary_card(quiz):
    # CSS attr() can't resolve arbitrary attribute values into a color
    # property in any current browser (verified empirically — border-left-color
    # computed to black, not the theme color, with both plain attr(data-theme)
    # and typed attr(data-theme color)). Inline style is the reliable path;
    # data-theme is kept alongside it for future JS/debugging hooks.
    subtitle = f"{quiz['results_label']} · {len(quiz['questions'])} questions"
    theme = esc(quiz["theme_color"])
    return (
        f'<a href="/{esc(quiz["slug"])}/index.html" class="secondary-card" '
        f'data-theme="{theme}" style="border-left: 3px solid {theme};">'
        f'<div class="quiz-title">{esc(quiz["card_title"])}</div>'
        f'<div class="quiz-subtitle">{esc(subtitle)}</div>'
        f"</a>"
    )


# --------------------------------------------------------------------------
# Page builders
# --------------------------------------------------------------------------

def build_quiz_page(quiz, site, footer_links_html, template):
    canonical = f"{site['base_url']}/{quiz['slug']}/"
    tokens = {
        "PAGE_TITLE": esc(quiz["title"]),
        "META_DESCRIPTION": esc(quiz["meta_description"]),
        "CANONICAL_URL": esc(canonical),
        "OG_TITLE": esc(quiz["title"]),
        "OG_DESCRIPTION": esc(quiz["meta_description"]),
        "OG_URL": esc(canonical),
        "JSON_LD": build_quiz_json_ld(quiz, canonical),
        "H1": esc(quiz["h1"]),
        "INTRO": esc(quiz["intro"]),
        "SLUG": esc(quiz["slug"]),
        "ALL_RESULTS_HTML": render_all_results(quiz["results"]),
        "ARTICLE_HTML": render_article(quiz["article"]),
        "FAQ_HTML": render_faq(quiz["faq"]),
        "QUIZ_DATA_JSON": build_quiz_data(quiz),
        "FOOTER_LINKS": footer_links_html,
    }
    html_out = fill(template, tokens)

    if len(quiz["title"]) >= 60:
        print(f"  WARNING: title >= 60 chars for {quiz['slug']}")
    if len(quiz["meta_description"]) >= 160:
        print(f"  WARNING: meta_description >= 160 chars for {quiz['slug']}")

    page_dir = os.path.join(DIST, quiz["slug"])
    os.makedirs(page_dir, exist_ok=True)
    with open(os.path.join(page_dir, "index.html"), "w", encoding="utf-8") as f:
        f.write(html_out)


def build_homepage(quizzes, site, homepage_content, footer_links_html, template):
    flagship = next(q for q in quizzes if q.get("flagship"))
    secondary = [q for q in quizzes if not q.get("flagship")]

    canonical = f"{site['base_url']}/"
    title = f"{site['name']} — {site['tagline']}"
    meta_description = "Take a quiz, find your aesthetic. Cottagecore, dark academia, y2k, and more — find out what you actually are."

    tokens = {
        "PAGE_TITLE": esc(title),
        "META_DESCRIPTION": esc(meta_description),
        "CANONICAL_URL": esc(canonical),
        "OG_TITLE": esc(title),
        "OG_DESCRIPTION": esc(meta_description),
        "OG_URL": esc(canonical),
        "JSON_LD": build_site_json_ld(site),
        "FLAGSHIP_CARD_HTML": render_flagship_card(flagship),
        "SECONDARY_CARDS_HTML": "\n".join(render_secondary_card(q) for q in secondary),
        "HOMEPAGE_CONTENT": '<div class="homepage-content">' + homepage_content + "</div>",
        "FOOTER_LINKS": footer_links_html,
    }
    html_out = fill(template, tokens)

    with open(os.path.join(DIST, "index.html"), "w", encoding="utf-8") as f:
        f.write(html_out)


def build_404(quizzes, site, footer_links_html, template):
    flagship = next(q for q in quizzes if q.get("flagship"))
    secondary = [q for q in quizzes if not q.get("flagship")]

    canonical = f"{site['base_url']}/404.html"
    title = "Page Not Found — vibequiz"
    meta_description = "This page doesn't exist, but our quizzes do."

    tokens = {
        "PAGE_TITLE": esc(title),
        "META_DESCRIPTION": esc(meta_description),
        "CANONICAL_URL": esc(canonical),
        "OG_TITLE": esc(title),
        "OG_DESCRIPTION": esc(meta_description),
        "OG_URL": esc(canonical),
        "FLAGSHIP_CARD_HTML": render_flagship_card(flagship),
        "SECONDARY_CARDS_HTML": "\n".join(render_secondary_card(q) for q in secondary),
        "FOOTER_LINKS": footer_links_html,
    }
    html_out = fill(template, tokens)

    with open(os.path.join(DIST, "404.html"), "w", encoding="utf-8") as f:
        f.write(html_out)


# --------------------------------------------------------------------------
# Sitemap / robots
# --------------------------------------------------------------------------

def build_sitemap(quizzes, site):
    today = date.today().isoformat()
    urls = [site["base_url"] + "/"] + [f"{site['base_url']}/{q['slug']}/" for q in quizzes]
    entries = "\n".join(
        f"  <url><loc>{esc(u)}</loc><lastmod>{today}</lastmod></url>" for u in urls
    )
    xml = (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
        f"{entries}\n"
        "</urlset>\n"
    )
    with open(os.path.join(DIST, "sitemap.xml"), "w", encoding="utf-8") as f:
        f.write(xml)


def build_robots(site):
    content = "User-agent: *\nAllow: /\n\nSitemap: " + site["base_url"] + "/sitemap.xml\n"
    with open(os.path.join(DIST, "robots.txt"), "w", encoding="utf-8") as f:
        f.write(content)


def build_cname(site):
    domain = site["base_url"].split("//", 1)[-1]
    with open(os.path.join(DIST, "CNAME"), "w", encoding="utf-8", newline="\n") as f:
        f.write(domain + "\n")


# --------------------------------------------------------------------------
# Main
# --------------------------------------------------------------------------

def main():
    if os.path.exists(DIST):
        shutil.rmtree(DIST)
    os.makedirs(DIST, exist_ok=True)

    config = load_config()
    site = config["site"]
    quizzes = config["quizzes"]

    quiz_template = read_template("template.html")
    index_template = read_template("template_index.html")
    notfound_template = read_template("template_404.html")

    footer_links_html = render_footer_links(quizzes)

    for quiz in quizzes:
        build_quiz_page(quiz, site, footer_links_html, quiz_template)
        print(f"  built /{quiz['slug']}/")

    build_homepage(quizzes, site, config["homepage_content"], footer_links_html, index_template)
    print("  built /")

    build_404(quizzes, site, footer_links_html, notfound_template)
    print("  built /404.html")

    build_sitemap(quizzes, site)
    build_robots(site)
    build_cname(site)

    shutil.copy(os.path.join(ROOT, "style.css"), os.path.join(DIST, "style.css"))
    shutil.copy(os.path.join(ROOT, "quiz-engine.js"), os.path.join(DIST, "quiz-engine.js"))
    # Dev-time fallback so the site works with `python build.py` alone, no
    # node/terser required. CI overwrites this with a real minified build
    # (see .github/workflows/deploy.yml, Phase 7).
    shutil.copy(os.path.join(ROOT, "quiz-engine.js"), os.path.join(DIST, "quiz-engine.min.js"))

    static_assets = [
        "favicon.svg",
        "favicon-32.png",
        "favicon-16.png",
        "apple-touch-icon.png",
        "icon-192.png",
        "icon-512.png",
        "og-image.png",
        "site.webmanifest",
    ]
    for asset in static_assets:
        src = os.path.join(ROOT, asset)
        if not os.path.exists(src):
            print(f"  WARNING: missing asset {asset}, not copied to dist/")
            continue
        shutil.copy(src, os.path.join(DIST, asset))

    print(f"\nBuild complete: {len(quizzes)} quiz pages + homepage written to {DIST}")


if __name__ == "__main__":
    main()
