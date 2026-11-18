# -*- coding: utf-8 -*-
"""
Mingzi build script — deterministic Chinese-name assignment + static SEO pages.

Open-source part of Mingzi (AGPL-3.0). The curated data files under data/ are
the working asset; keep them in sync when you extend the character pool.

Usage:
  python tools/build.py                 # build everything, no sitemap/canonical
  python tools/build.py --site-url https://you.github.io/mingzi
"""
import argparse, hashlib, html, json, os, random, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(ROOT, "data")
NAME_DIR = os.path.join(ROOT, "name")

MAX_PAGES = 500

# ---------------------------------------------------------------- primitives
def fnv1a(s: str) -> int:
    h = 2166136261
    for ch in s:
        h ^= ord(ch) & 0xFFFFFFFF
        h = (h * 16777619) & 0xFFFFFFFF
    return h

def mulberry32(seed: int):
    a = seed & 0xFFFFFFFF
    while True:
        a = (a + 0x6D2B79F5) & 0xFFFFFFFF
        t = a
        t = (((t ^ (t >> 15)) * (t | 1)) & 0xFFFFFFFF)
        t = (t + (((t ^ (t >> 7)) * (t | 61)) & 0xFFFFFFFF)) & 0xFFFFFFFF
        out = (t ^ (t >> 14)) & 0xFFFFFFFF
        yield out / 4294967296.0

TONEMARK = {1: "āáǎà", 2: "āáǎà", 3: "āáǎà", 4: "āáǎà"}
VOWELS = {"a": "āáǎà", "o": "ōóǒò", "e": "ēéěè", "i": "īíǐì", "u": "ūúǔù", "v": "ǖǘǚǜ"}

def mark(syl: str, tone: int) -> str:
    for v in ("a", "o", "e"):
        if v in syl:
            return syl.replace(v, VOWELS[v][tone - 1])
    for v in ("iu", "ui"):
        if v in syl:
            return syl.replace(v[-1], VOWELS[v[-1]][tone - 1])
    for ch in reversed(syl):
        if ch in VOWELS:
            return syl.replace(ch, VOWELS[ch][tone - 1])
    return syl

# ---------------------------------------------------------------- data
def load_chars():
    chars = []
    with open(os.path.join(DATA, "hanzi.tsv"), encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            c, p, t, g, tag, meaning = line.split("\t")
            chars.append({"c": c, "p": p, "t": int(t), "g": g, "tag": tag, "m": meaning})
    return chars

def load_names():
    names, seen = [], set()
    with open(os.path.join(DATA, "names.txt"), encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            n, g = line.split("|")
            if n.lower() in seen:
                continue
            seen.add(n.lower())
            names.append({"name": n, "gender": g})
    return names

SURNAME_POOL = {
    "a": [("安", "an", 1)], "b": [("白", "bai", 2), ("贝", "bei", 4)],
    "c": [("陈", "chen", 2), ("程", "cheng", 2), ("曹", "cao", 2), ("崔", "cui", 1), ("常", "chang", 2), ("蔡", "cai", 4), ("岑", "cen", 2)],
    "d": [("杜", "du", 4), ("丁", "ding", 1), ("董", "dong", 3), ("邓", "deng", 4), ("段", "duan", 4), ("戴", "dai", 4)],
    "e": [("叶", "ye", 4)],
    "f": [("范", "fan", 4), ("方", "fang", 1), ("冯", "feng", 2), ("傅", "fu", 4)],
    "g": [("高", "gao", 1), ("顾", "gu", 4), ("郭", "guo", 1), ("甘", "gan", 1), ("葛", "ge", 3)],
    "h": [("黄", "huang", 2), ("韩", "han", 2), ("何", "he", 2), ("洪", "hong", 2), ("侯", "hou", 2), ("华", "hua", 4), ("郝", "hao", 3)],
    "i": [("伊", "yi", 1)],
    "j": [("金", "jin", 1), ("江", "jiang", 1), ("姜", "jiang", 1), ("蒋", "jiang", 3), ("简", "jian", 3), ("贾", "jia", 3), ("纪", "ji", 3)],
    "k": [("柯", "ke", 1), ("孔", "kong", 3), ("康", "kang", 1)],
    "l": [("李", "li", 3), ("林", "lin", 2), ("刘", "liu", 2), ("罗", "luo", 2), ("梁", "liang", 2), ("卢", "lu", 2), ("陆", "lu", 4), ("黎", "li", 2), ("廖", "liao", 4), ("骆", "luo", 4), ("柳", "liu", 3), ("赖", "lai", 4), ("雷", "lei", 2), ("龙", "long", 2), ("蓝", "lan", 2)],
    "m": [("马", "ma", 3), ("孟", "meng", 4), ("莫", "mo", 4), ("毛", "mao", 2), ("梅", "mei", 2)],
    "n": [("倪", "ni", 2), ("聂", "nie", 4)],
    "o": [("欧", "ou", 1)],
    "p": [("彭", "peng", 2), ("潘", "pan", 1), ("裴", "pei", 2)],
    "q": [("秦", "qin", 2), ("钱", "qian", 2), ("齐", "qi", 2), ("乔", "qiao", 2), ("屈", "qu", 1), ("邱", "qiu", 1)],
    "r": [("任", "ren", 4), ("冉", "ran", 3), ("荣", "rong", 2)],
    "s": [("宋", "song", 4), ("孙", "sun", 1), ("苏", "su", 1), ("沈", "shen", 3), ("石", "shi", 2), ("史", "shi", 3), ("邵", "shao", 4), ("施", "shi", 1), ("申", "shen", 1), ("桑", "sang", 1), ("盛", "sheng", 4)],
    "t": [("唐", "tang", 2), ("陶", "tao", 2), ("谭", "tan", 2), ("田", "tian", 2), ("汤", "tang", 1), ("童", "tong", 2)],
    "u": [("吴", "wu", 2)],
    "v": [("魏", "wei", 4), ("温", "wen", 1), ("卫", "wei", 4)],
    "w": [("王", "wang", 2), ("吴", "wu", 2), ("万", "wan", 4), ("汪", "wang", 1), ("卫", "wei", 4), ("温", "wen", 1), ("文", "wen", 2), ("翁", "weng", 1), ("伍", "wu", 3)],
    "x": [("徐", "xu", 2), ("许", "xu", 3), ("夏", "xia", 4), ("萧", "xiao", 1), ("谢", "xie", 4), ("邢", "xing", 2), ("辛", "xin", 1), ("席", "xi", 2), ("项", "xiang", 4), ("熊", "xiong", 2)],
    "y": [("杨", "yang", 2), ("叶", "ye", 4), ("姚", "yao", 2), ("严", "yan", 2), ("颜", "yan", 2), ("余", "yu", 2), ("俞", "yu", 2), ("袁", "yuan", 2), ("岳", "yue", 4), ("元", "yuan", 2), ("尹", "yin", 3), ("易", "yi", 4), ("于", "yu", 2), ("虞", "yu", 2), ("应", "ying", 4), ("尤", "you", 2)],
    "z": [("张", "zhang", 1), ("赵", "zhao", 4), ("周", "zhou", 1), ("郑", "zheng", 4), ("朱", "zhu", 1), ("邹", "zou", 1), ("庄", "zhuang", 1), ("卓", "zhuo", 2), ("曾", "zeng", 1), ("詹", "zhan", 1), ("钟", "zhong", 1)],
}

THEMES = {
    "sophia": ["mind"], "sophie": ["mind"], "sofia": ["mind"], "sofie": ["mind"], "zsofia": ["mind"],
    "grace": ["virtue"], "serenity": ["virtue"], "hope": ["virtue"], "faith": ["virtue"],
    "amara": ["virtue"], "vera": ["virtue"], "veronica": ["virtue"], "adele": ["virtue"],
    "ada": ["virtue"], "albert": ["virtue"], "alberto": ["virtue"], "ethan": ["virtue"],
    "victor": ["virtue"], "bella": ["virtue"], "bonnie": ["virtue"], "nadia": ["virtue"],
    "felix": ["joy"], "priya": ["joy"], "david": ["joy"], "farah": ["joy"],
    "naomi": ["joy"], "noemi": ["joy"],
    "kavya": ["ink"], "maya": ["mind"],
    "lily": ["floral"], "rose": ["floral"], "rosa": ["floral"], "iris": ["floral"],
    "jasmine": ["floral"], "flora": ["floral"], "ivy": ["floral"], "hana": ["floral"],
    "zara": ["floral"], "ren": ["floral"], "willow": ["tree"], "lina": ["tree"],
    "aurora": ["light"], "lucy": ["light"], "nora": ["light"], "eleanor": ["light"],
    "claire": ["light"], "clara": ["light"], "helena": ["light"], "elena": ["light"],
    "alina": ["light"], "luca": ["light"], "lucas": ["light"], "haruto": ["light"],
    "noor": ["light"], "ravi": ["light"], "stella": ["sky"], "luna": ["sky"],
    "skylar": ["sky"], "nova": ["sky"], "diana": ["sky"], "selena": ["sky"],
    "estelle": ["sky"], "esther": ["sky"], "danica": ["sky"], "tara": ["sky"],
    "mira": ["sky"], "kai": ["water"], "brooks": ["water"], "savannah": ["nature"],
    "marisol": ["water", "light"], "marika": ["water"],
    "summer": ["season"], "autumn": ["season"], "winter": ["season"],
    "pearl": ["jade"], "jade": ["jade"], "ruby": ["jade"], "amber": ["jade"],
    "margot": ["jade"], "greta": ["jade"], "maja": ["jade"], "esmeralda": ["jade"],
}

TABOO_FINAL = {"si3", "si4", "gui3", "bing4", "dao4", "sha1", "ku1", "ku4", "lei4", "shu1"}

# ---------------------------------------------------------------- assignment
def assign(name: str, gender: str, chars):
    key = name.strip().lower()
    rng = mulberry32(fnv1a(key))
    initial = key[0] if key[0] in SURNAME_POOL else "l"
    surname = SURNAME_POOL[initial][int(next(rng) * len(SURNAME_POOL[initial]))]

    if gender == "F":
        pool = [c for c in chars if c["g"] == "F" or c["g"] == "N"]
    else:
        pool = [c for c in chars if c["g"] == "M" or c["g"] == "N"]

    tags = THEMES.get(key)
    themed = [c for c in pool if tags and c["tag"] in tags] if tags else []
    cand1 = themed if len(themed) >= 6 else pool

    def pick_given(cands, exclude_chars, exclude_pys):
        cands = [c for c in cands if c["c"] not in exclude_chars and (c["p"] + str(c["t"])) not in TABOO_FINAL]
        cands = [c for c in cands if c["p"] not in exclude_pys]
        if not cands:
            cands = [c for c in pool if (c["p"] + str(c["t"])) not in TABOO_FINAL]
        return cands

    c1_list = pick_given(cand1, {surname[0]}, {surname[1]})
    g1 = c1_list[int(next(rng) * len(c1_list))]

    c2_list = pick_given(pool, {surname[0], g1["c"]}, {surname[1], g1["p"]})
    scored = []
    for c2 in c2_list:
        tones = {surname[2], g1["t"], c2["t"]}
        score = len(tones) * 2
        if c2["t"] in (2, 4):
            score += 1
        if g1["t"] == 3 and c2["t"] == 3:
            score -= 1
        scored.append((score, c2))
    scored.sort(key=lambda x: -x[0])
    top = scored[:6]
    g2 = top[int(next(rng) * len(top))][1]

    return {
        "s": {"c": surname[0], "p": surname[1], "t": surname[2]},
        "g": [g1, g2],
    }

def full_py(mapping):
    parts = [mapping["s"]] + mapping["g"]
    return " ".join(mark(x["p"], x["t"]) for x in parts)

# ---------------------------------------------------------------- pages
def esc(s):
    return html.escape(s, quote=True)

CHAR_TAGS_EN = {
    "floral": "flowers & plants", "tree": "trees & wood", "nature": "nature",
    "virtue": "character & virtue", "mind": "mind & wisdom", "joy": "joy",
    "music": "music", "ink": "letters & art", "jade": "jade & gems",
    "sky": "sky & stars", "light": "light & dawn", "weather": "weather",
    "water": "water & rivers", "sea": "sea & travel", "earth": "stone & peaks",
    "metal": "metal & craft", "season": "seasons", "animal": "auspicious animals",
    "carriage": "dignity", "legend": "legend", "color": "color", "time": "time",
    "soft": "gentleness", "speech": "words", "harmony": "harmony",
}

PAGE_TMPL = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{name} in Chinese — {chars} ({py}) | Mingzi</title>
<meta name="description" content="The name {name} in Chinese: {chars} ({py}). A real Chinese surname that echoes {name}, plus a two-character given name chosen for meaning, tone flow and safety. Free, instant, no sign-up.">
{canonical}<link rel="stylesheet" href="{prefix}assets/style.css">
</head>
<body>
<header class="top">
  <a class="brand" href="{prefix}"><span class="seal-dot">名</span> Mingzi</a>
  <a class="cta-mini" href="{prefix}#generator">Get your name</a>
</header>
<main>
  <article class="namepage">
    <p class="kicker">The name <strong>{name}</strong>, in real Chinese</p>
    <h1 class="bigname" lang="zh">{chars}</h1>
    <p class="bigpy">{py}</p>
    <p class="lede">{name} becomes <strong lang="zh">{chars}</strong> ({py}) — built the way Chinese names are actually built: a real surname that echoes the sound of {name}, plus a two-character given name chosen for meaning, tone flow and cultural safety.</p>

    <section class="charcards">
      {cards}
    </section>

    <section class="why">
      <h2>Why this name works</h2>
      <p>{why}</p>
      <p class="toneline">Tone pattern: <strong>{tones}</strong> — {tonecopy}</p>
      <p class="safety">✓ Checked against the cultural-safety list: nothing here sounds like an unlucky word, and no character is dated or out of place on a modern name seal.</p>
    </section>

    <section class="tiers-mini">
      <h2>Make it official</h2>
      <p>Turn <strong lang="zh">{chars}</strong> into something you can keep: a hand-signed name certificate with your personal courtesy name (表字), a carved-seal artwork, or a tattoo-safety sheet for your artist.</p>
      <div class="tier-row">
        <div class="tier"><h3>Signature + meaning</h3><p class="price">$4.9</p><p>Your name as a designed signature card, with a full meaning sheet.</p></div>
        <div class="tier featured"><h3>Name certificate</h3><p class="price">$9.9</p><p>Signature + courtesy name + classical sources + seal artwork + pronunciation audio, on a print-ready certificate.</p></div>
        <div class="tier"><h3>Human-reviewed</h3><p class="price">$19.9</p><p>Every line re-checked by a native reader, with one round of changes. Limited slots weekly.</p></div>
      </div>
      <p><a class="btn" href="{prefix}#tiers">Get the certificate →</a></p>
    </section>

    <section class="related">
      <h2>Other names</h2>
      <p>{related}</p>
    </section>
  </article>
</main>
<footer class="foot">
  <p>Mingzi — your name, in real Chinese. Free forever for the name; pay only for the keepsakes.</p>
  <p><a href="{prefix}">Home</a> · <a href="{prefix}#generator">Generator</a> · <a href="{prefix}#tiers">Certificate</a></p>
</footer>
</body>
</html>
"""

def build(site_url: str):
    chars = load_chars()
    names = load_names()
    selected = names[:MAX_PAGES]
    print(f"chars: {len(chars)}, names selected: {len(selected)} (of {len(names)})")

    mappings = []
    for i, item in enumerate(selected):
        m = assign(item["name"], item["gender"], chars)
        slug = item["name"].lower()
        mappings.append({**item, "slug": slug, **m})

    # data for the front-end generator (single source of truth)
    with open(os.path.join(DATA, "hanzi.json"), "w", encoding="utf-8") as f:
        json.dump({
            "chars": chars,
            "surnames": {k: [{"c": c, "p": p, "t": t} for c, p, t in v] for k, v in SURNAME_POOL.items()},
            "themes": THEMES,
            "taboo": sorted(TABOO_FINAL),
        }, f, ensure_ascii=False)
    with open(os.path.join(DATA, "names.json"), "w", encoding="utf-8") as f:
        json.dump([{
            "name": m["name"], "gender": m["gender"], "slug": m["slug"],
            "s": m["s"], "g": m["g"],
        } for m in mappings], f, ensure_ascii=False)

    # static pages
    os.makedirs(NAME_DIR, exist_ok=True)
    for i, m in enumerate(mappings):
        name, g, s = m["name"], m["gender"], m["s"]
        g1, g2 = m["g"]
        chars_full = s["c"] + g1["c"] + g2["c"]
        py = full_py(m)
        tones = f"{s['t']}-{g1['t']}-{g2['t']}"
        tonecopy = "rises and lands crisply, easy to say" if g2["t"] in (2, 4) else "smooth and balanced"

        cards = []
        for ch, role in ((s, "your surname"), (g1, "given name"), (g2, "given name")):
            meaning = ch.get("m", "a classic Chinese surname")
            tag = ch.get("tag", "surname")
            cards.append(
                f'<div class="charcard"><span class="zi" lang="zh">{esc(ch["c"])}</span>'
                f'<span class="zp">{esc(mark(ch["p"], ch["t"]))}{ch["t"]}</span>'
                f'<span class="zm">{esc(meaning)}</span>'
                f'<span class="zt">{esc(CHAR_TAGS_EN.get(tag, tag))} · {role}</span></div>'
            )

        why = (
            f"The surname {esc(s['c'])} ({esc(mark(s['p'], s['t']))}) is one of the classic Chinese surnames "
            f"and starts with the same sound as {name}. {esc(g1['c'])} ({esc(mark(g1['p'], g1['t']))}) carries the sense of {esc(g1['m'])}, "
            f"and {esc(g2['c'])} ({esc(mark(g2['p'], g2['t']))}) carries {esc(g2['m'])} — together the given name reads like a small "
            f"blessing, not a transliteration. Both characters are common in real given names, so nothing marks the name as foreign."
        )

        rel = []
        for j in (i - 2, i - 1, i + 1, i + 2):
            if 0 <= j < len(mappings) and mappings[j]["gender"] == g:
                r = mappings[j]
                rel.append(f'<a href="../{r["slug"]}/">{r["name"]} → {esc(r["s"]["c"] + r["g"][0]["c"] + r["g"][1]["c"])}</a>')
        related = " · ".join(rel[:3]) or '<a href="../">Browse all names</a>'

        canonical = f'<link rel="canonical" href="{esc(site_url)}/name/{m["slug"]}/">\n' if site_url else ""
        page = PAGE_TMPL.format(
            name=esc(name), chars=esc(chars_full), py=esc(py), prefix="../../",
            canonical=canonical, cards="\n      ".join(cards), why=why,
            tones=tones, tonecopy=tonecopy, related=related,
        )
        d = os.path.join(NAME_DIR, m["slug"])
        os.makedirs(d, exist_ok=True)
        with open(os.path.join(d, "index.html"), "w", encoding="utf-8") as f:
            f.write(page)

    # phase & element landing pages (SEO)
    import json as _json
    moon_data = _json.load(open(os.path.join(DATA, "moon.json"), encoding="utf-8"))
    wx_data = _json.load(open(os.path.join(DATA, "wuxing.json"), encoding="utf-8"))
    landing = []
    for mid in moon_data["moonOrder"]:
        mo = moon_data["moons"][mid]
        landing.append(("phases", mid, mo["cn"], mo["en"], mo["epithet"], mo["traits"], mo["fit"], "moon-quiz"))
    for eid in wx_data["elementOrder"]:
        el = wx_data["elements"][eid]
        landing.append(("elements", eid, el["cn"], el["en"], el["epithet"], el["traits"], el["fit"], "five-natures"))

    def tag_examples(slug, gender, tags):
        pool = [c for c in chars if (gender == "F" and c["g"] in ("F", "N")) or (gender == "M" and c["g"] in ("M", "N"))]
        flat = [c for c in pool if c["tag"] in tags]
        if len(flat) < 2:
            flat = pool
        r2 = mulberry32(fnv1a(slug + gender))
        surnames = SURNAME_POOL["a"]  # neutral: use a common surname for showcase
        sn = surnames[int(next(r2) * len(surnames))]
        g1 = flat[int(next(r2) * len(flat))]
        rest = [c for c in flat if c["c"] != g1["c"]]
        g2 = rest[int(next(r2) * len(rest))]
        return {"s": {"c": sn[0], "p": sn[1], "t": sn[2]}, "g": [g1, g2]}

    def link_rel(kind):
        return "../../"

    for kind, eid, cn, en, epithet, traits, tags, cta in landing:
        slug = en.lower().replace(" ", "-")
        rel = "../../"
        canonical_l = f'<link rel="canonical" href="{esc(site_url)}/{kind}/{slug}/">\n' if site_url else ""
        ex_html = ""
        for gg, who in (("F", "her"), ("M", "him")):
            mm = tag_examples(slug + kind, gg, tags)
            full = mm["s"]["c"] + mm["g"][0]["c"] + mm["g"][1]["c"]
            py = " ".join(mark(x["p"], x["t"]) for x in [mm["s"], mm["g"][0], mm["g"][1]])
            ex_html += f'<p class="exname"><span lang="zh">{esc(full)}</span> ({esc(py)}) — for {who}</p>'
        page_html = f'''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{en} ({cn}) — {epithet} | Mingzi</title>
<meta name="description" content="{en} ({cn}), {epithet}. {traits[:140]} See {en}-nature Chinese names — two free examples — and get your own through the free quiz.">
{canonical_l}<link rel="stylesheet" href="{rel}assets/style.css">
</head>
<body>
<header class="top"><a class="brand" href="{rel}"><span class="seal-dot">名</span> Mingzi</a><a class="cta-mini" href="{rel}{cta}.html">Take the quiz</a></header>
<main class="namepage">
<p class="kicker">A nature, and the names that walk with it</p>
<h1 class="bigname" style="font-size:clamp(56px,12vw,100px)" lang="zh">{cn}</h1>
<p class="bigpy">{en} · {epithet}</p>
<p class="lede">{traits}</p>
<h2 class="sect">Names that fit {en}</h2>
{ex_html}
<p><a class="btn" href="{rel}{cta}.html">Get your own — free quiz →</a></p>
<p class="related">For fun and self-reflection; no promises about fate.</p>
</main>
<footer class="foot"><p>Mingzi — your name, in real Chinese.</p></footer>
</body>
</html>'''
        dpath = os.path.join(ROOT, kind, slug)
        os.makedirs(dpath, exist_ok=True)
        with open(os.path.join(dpath, "index.html"), "w", encoding="utf-8") as f:
            f.write(page_html)

    # sitemap
    if site_url:
        urls = [f"{site_url}/", f"{site_url}/quiz.html", f"{site_url}/mystic.html", f"{site_url}/zodiac.html"] \
            + [f"{site_url}/name/{m['slug']}/" for m in mappings] \
            + [f"{site_url}/{kind}/{en.lower().replace(' ', '-')}/" for kind, _eid, _cn, en, _ep, _tr, _tg, _cta in landing]
        with open(os.path.join(ROOT, "sitemap.xml"), "w", encoding="utf-8") as f:
            f.write('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n')
            for u in urls:
                f.write(f"  <url><loc>{esc(u)}</loc></url>\n")
            f.write("</urlset>\n")
        print(f"sitemap.xml written with {len(urls)} urls")

    # indexnow key
    keyfile = os.path.join(DATA, "indexnow-key.txt")
    if not os.path.exists(keyfile):
        with open(keyfile, "w", encoding="utf-8") as f:
            f.write(hashlib.sha256(os.urandom(32)).hexdigest()[:32])
    key = open(keyfile, encoding="utf-8").read().strip()
    with open(os.path.join(ROOT, key + ".txt"), "w", encoding="utf-8") as f:
        f.write(key)

    # console samples
    print("samples:")
    for m in mappings[:8]:
        print(f"  {m['name']:<12} -> {m['s']['c']}{m['g'][0]['c']}{m['g'][1]['c']}  {full_py(m)}")
    print(f"done: {len(mappings)} pages in /name/")

if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--site-url", default="")
    args = ap.parse_args()
    build(args.site_url)
