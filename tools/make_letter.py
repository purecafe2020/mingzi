# -*- coding: utf-8 -*-
"""Sample 'Letter from Wangshu' (解读信) — paid keepsake mockup, bilingual.
Output: samples/letter.png (1080x1500)"""
import os
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "samples")
os.makedirs(OUT, exist_ok=True)
KAI = "C:/Windows/Fonts/simkai.ttf"
YAHEI = "C:/Windows/Fonts/msyh.ttc"
PAPER = (250, 247, 240); INK = (43, 39, 35); SOFT = (107, 98, 87)
VERM = (166, 58, 43); VERM_D = (140, 47, 34); GOLD = (232, 182, 76)

def font(path, size): return ImageFont.truetype(path, size)

img = Image.new("RGB", (1080, 1500), PAPER)
d = ImageDraw.Draw(img)
m = 48
d.rectangle([m, m, 1080-m, 1500-m], outline=VERM, width=3)
d.rectangle([m+8, m+8, 1080-m-8, 1500-m-8], outline=VERM, width=1)

# header: moon phases arc
xs = [360, 420, 480, 540, 600, 660, 720]
phases = [(0.15, 'r'), (0.3, 'r'), (0.5, 'r'), (0.85, 'r'), (1.0, 'f'), (0.7, 'l'), (0.35, 'l')]
for (x, (lit, side)) in zip(xs, phases):
    d.ellipse([x-16, 96-16, x+16, 96+16], fill=SOFT)
    if lit >= 1:
        d.ellipse([x-16, 96-16, x+16, 96+16], fill=GOLD)
    elif lit == 0.5:
        d.ellipse([x-16, 96-16, x+16, 96+16], fill=GOLD)
        d.pieslice([x-16, 96-16, x+16, 96+16], 90 if side == 'r' else 270, 270 if side == 'r' else 90, fill=SOFT)
    else:
        d.ellipse([x-16, 96-16, x+16, 96+16], fill=GOLD)
        off = 26 if side == 'r' else -26
        d.ellipse([x-off-13, 96-16, x-off+13, 96+16], fill=PAPER)

d.text((540, 170), "A LETTER FROM WANGSHU", font=font(YAHEI, 30), fill=SOFT, anchor="mm")
d.text((540, 218), "望舒的信", font=font(KAI, 38), fill=VERM_D, anchor="mm")
d.text((540, 262), "for Olivia · Full Moon · 欧安茉", font=font(YAHEI, 26), fill=SOFT, anchor="mm")

en_lines = [
    ("Dear Olivia,", INK, 30),
    ("You came to me under a Full Moon — the phase of people", SOFT, 26),
    ("who walk into a room and quietly change its temperature.", SOFT, 26),
    ("Your name was not chosen to change you.", INK, 26),
    ("It was chosen to walk beside you.", INK, 26),
]
y = 330
for txt, col, sz in en_lines:
    d.text((540, y), txt, font=font(YAHEI, sz), fill=col, anchor="mm"); y += 46

cn_lines = [
    "欧者，声之所寄；呼其名，名必应。",
    "安者，静也。予人安宁者，亦自安。",
    "茉者，茉莉。小，而不可忘。",
    "",
    "字曰静和——与名相应而不相复，古之遗意。",
    "名轻，翼自生。",
]
y = 620
for txt in cn_lines:
    if txt:
        d.text((540, y), txt, font=font(KAI, 34), fill=INK, anchor="mm")
    y += 58

d.text((540, 960), "— 望舒, under the Full Moon", font=font(YAHEI, 28), fill=VERM_D, anchor="mm")

d.text((540, 1080), "Every name passes the cultural-safety check —", font=font(YAHEI, 22), fill=SOFT, anchor="mm")
d.text((540, 1112), "nothing unlucky, nothing dated, nothing borrowed from another's story.", font=font(YAHEI, 22), fill=SOFT, anchor="mm")
d.text((540, 1160), "A name adds wings, not weight.", font=font(YAHEI, 28), fill=VERM_D, anchor="mm")

# seal
size = 130; cx, cy = 840, 1290
d.rounded_rectangle([cx-size//2, cy-size//2, cx+size//2, cy+size//2], radius=int(size*0.08), fill=VERM)
d.rectangle([cx-size//2+11, cy-size//2+11, cx+size//2-11, cy+size//2-11], outline=PAPER, width=3)
d.text((cx, cy-size*0.17), "安", font=font(KAI, int(size*0.30)), fill=PAPER, anchor="mm")
d.text((cx, cy+size*0.17), "茉", font=font(KAI, int(size*0.30)), fill=PAPER, anchor="mm")

d.text((540, 1420), "Mingzi — your name, in real Chinese · https://879879.xyz",
       font=font(YAHEI, 20), fill=SOFT, anchor="mm")

img.save(os.path.join(OUT, "letter.png"))
print("letter.png saved", img.size)
