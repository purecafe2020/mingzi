# -*- coding: utf-8 -*-
"""Generate 3 paid-product sample images for the store listing (Lemon Squeezy).

These are product mockups rendered with the same design language as the site:
paper background, vermilion seal, KaiTi display characters.
Outputs -> samples/certificate.png, samples/banner.png, samples/tattoo.png
"""
import os
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "samples")
os.makedirs(OUT, exist_ok=True)

KAI = "C:/Windows/Fonts/simkai.ttf"
YAHEI = "C:/Windows/Fonts/msyh.ttc"
PAPER = (250, 247, 240)
INK = (43, 39, 35)
SOFT = (107, 98, 87)
VERM = (166, 58, 43)
VERM_D = (140, 47, 34)

def font(path, size):
    return ImageFont.truetype(path, size)

def paper_bg(w, h):
    img = Image.new("RGB", (w, h), PAPER)
    d = ImageDraw.Draw(img)
    m = int(w * 0.045)
    d.rectangle([m, m, w - m, h - m], outline=VERM, width=max(3, w // 320))
    d.rectangle([m + 8, m + 8, w - m - 8, h - m - 8], outline=VERM, width=1)
    return img, d

def seal(d, cx, cy, size, chars):
    r = int(size * 0.08)
    d.rounded_rectangle([cx - size // 2, cy - size // 2, cx + size // 2, cy + size // 2],
                        radius=r, fill=VERM)
    inset = int(size * 0.08)
    d.rectangle([cx - size // 2 + inset, cy - size // 2 + inset,
                 cx + size // 2 - inset, cy + size // 2 - inset],
                outline=PAPER, width=max(2, int(size * 0.02)))
    f = font(KAI, int(size * 0.30))
    d.text((cx, cy - size * 0.17), chars[0], font=f, fill=PAPER, anchor="mm")
    d.text((cx, cy + size * 0.17), chars[1], font=f, fill=PAPER, anchor="mm")

def center(d, y, text, f, fill=INK):
    d.text((540, y), text, font=f, fill=fill, anchor="mm")

# ------------------------------------------------------------------ certificate
def certificate():
    w, h = 1080, 1350
    img, d = paper_bg(w, h)
    f_small = font(YAHEI, 26)
    f_caps = font(YAHEI, 30)
    d.text((540, 120), "MINGZI · NAME CERTIFICATE", font=f_caps, fill=SOFT, anchor="mm")
    d.text((540, 170), "名字 · 命名证书", font=font(KAI, 34), fill=VERM_D, anchor="mm")

    center(d, 400, "欧安茉", font(KAI, 190))
    center(d, 560, "Ōu Ānmò", font(YAHEI, 44), VERM_D)
    center(d, 610, "the Chinese name of Olivia", font(YAHEI, 26), SOFT)

    lines = [
        "欧 Ōu — a classic surname, one with the sound of Olivia",
        "安 Ān — peace; calm",
        "茉 Mò — jasmine bud",
        "",
        "Courtesy name 表字 · 静和 Jìnghé — “calm harmony”,",
        "given in the classical style to answer the name",
        "",
        "Checked for cultural safety · no unlucky homophones",
        "Pronunciation audio included · print-ready A4",
    ]
    y = 700
    for ln in lines:
        if ln:
            center(d, y, ln, f_small)
        y += 46

    seal(d, 860, 1170, 130, ["安", "茉"])
    d.text((540, 1280), "Mingzi — your name, in real Chinese", font=font(YAHEI, 22), fill=SOFT, anchor="mm")
    img.save(os.path.join(OUT, "certificate.png"))
    print("certificate.png", img.size)

# ------------------------------------------------------------------ banner
def banner():
    w, h = 1500, 500
    img, d = paper_bg(w, h)
    d.text((120, 110), "MINGZI · 名字", font=font(YAHEI, 26), fill=SOFT, anchor="lm")
    d.text((120, 240), "史知莉", font=font(KAI, 150), fill=INK, anchor="lm")
    d.text((128, 370), "Shǐ Zhīlì — the Chinese name of Sophia", font=font(YAHEI, 34), fill=VERM_D, anchor="lm")
    seal(d, 1210, 250, 220, ["知", "莉"])
    d.text((1210, 415), "知 · wisdom  莉 · jasmine", font=font(YAHEI, 22), fill=SOFT, anchor="mm")
    img.save(os.path.join(OUT, "banner.png"))
    print("banner.png", img.size)

# ------------------------------------------------------------------ tattoo card
def tattoo():
    w, h = 1080, 1350
    img, d = paper_bg(w, h)
    d.text((540, 120), "TATTOO SAFETY CARD", font=font(YAHEI, 30), fill=SOFT, anchor="mm")
    d.text((540, 168), "纹身安全卡", font=font(KAI, 36), fill=VERM_D, anchor="mm")

    center(d, 380, "叶原萱", font(KAI, 170))
    center(d, 530, "Yè Yuānxuān — for Emma", font(YAHEI, 40), VERM_D)

    checks = [
        ("✓", "No character sounds like an unlucky word"),
        ("✓", "No dated or comic characters in the name"),
        ("✓", "Reads naturally left-to-right on skin"),
        ("✓", "All three characters are standard forms"),
        ("✓", "Tones marked for your artist's reference"),
    ]
    y = 640
    for mark, txt in checks:
        d.text((240, y), mark, font=font(YAHEI, 30), fill=VERM, anchor="mm")
        d.text((280, y), txt, font=font(YAHEI, 28), fill=INK, anchor="lm")
        y += 56

    d.text((540, 990), "Characters for the artist:", font=font(YAHEI, 26), fill=SOFT, anchor="mm")
    d.text((540, 1060), "叶 · 原 · 萱   (Yè · Yuān · Xuān)", font=font(KAI, 40), fill=INK, anchor="mm")
    d.text((540, 1140), "show this card before the needle — changes are free before ink",
           font=font(YAHEI, 22), fill=SOFT, anchor="mm")
    seal(d, 850, 1230, 120, ["原", "萱"])
    img.save(os.path.join(OUT, "tattoo.png"))
    print("tattoo.png", img.size)

if __name__ == "__main__":
    certificate()
    banner()
    tattoo()
    print("done ->", OUT)
