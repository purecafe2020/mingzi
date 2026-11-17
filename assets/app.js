/* Mingzi front-end generator — mirrors tools/build.py logic (same tables via data/hanzi.json).
   For the 500 built-in names the result always matches /name/{slug}/ pages. */
(function () {
  "use strict";

  var CFG = window.MINGZI_CONFIG || {};
  var HANZI = null, NAMES = null, NAMES_BY_KEY = {};

  // ---------- deterministic primitives (identical to build.py) ----------
  function fnv1a(s) {
    var h = 2166136261;
    for (var i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619) >>> 0;
    }
    return h >>> 0;
  }
  function mulberry32(seed) {
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1) >>> 0;
      t = (t + (Math.imul(t ^ (t >>> 7), t | 61) >>> 0)) >>> 0;
      t = (t ^ (t >>> 14)) >>> 0;
      return t / 4294967296;
    };
  }
  var VOWELS = { a: "āáǎà", o: "ōóǒò", e: "ēéěè", i: "īíǐì", u: "ūúǔù", v: "ǖǘǚǜ" };
  function mark(syl, tone) {
    var v, i;
    for (i = 0; i < 3; i++) {
      v = "aoe"[i];
      if (syl.indexOf(v) >= 0) return syl.replace(v, VOWELS[v][tone - 1]);
    }
    for (i = 0; i < 2; i++) {
      v = ["iu", "ui"][i];
      if (syl.indexOf(v) >= 0) return syl.replace(v[v.length - 1], VOWELS[v[v.length - 1]][tone - 1]);
    }
    for (i = syl.length - 1; i >= 0; i--) {
      if (VOWELS[syl[i]]) return syl.replace(syl[i], VOWELS[syl[i]][tone - 1]);
    }
    return syl;
  }
  function fullPy(m) {
    var parts = [m.s, m.g[0], m.g[1]];
    return parts.map(function (x) { return mark(x.p, x.t); }).join(" ");
  }

  // ---------- assignment (mirrors build.py) ----------
  var TABOO = ["si3", "si4", "gui3", "bing4", "dao4", "sha1", "ku1", "ku4", "lei4", "shu1"];
  function guessGender(name) {
    var n = name.toLowerCase();
    if (/(a|e|i|y|ie|elle|ine|ana|ina|ella|lyn|lyn)$/.test(n)) return "F";
    return "M";
  }
  function assign(name, gender) {
    var key = name.trim().toLowerCase();
    var rng = mulberry32(fnv1a(key));
    var pool0 = HANZI.surnames[key[0]] || HANZI.surnames["l"];
    var surname = pool0[Math.floor(rng() * pool0.length)];

    var pool = HANZI.chars.filter(function (c) {
      return gender === "F" ? (c.g === "F" || c.g === "N") : (c.g === "M" || c.g === "N");
    });
    var tags = HANZI.themes[key];
    var themed = tags ? pool.filter(function (c) { return tags.indexOf(c.tag) >= 0; }) : [];
    var cand1 = themed.length >= 6 ? themed : pool;

    function ok(c, exclChars, exclPys) {
      if (exclChars.indexOf(c.c) >= 0) return false;
      if (exclPys.indexOf(c.p) >= 0) return false;
      if (TABOO.indexOf(c.p + c.t) >= 0) return false;
      return true;
    }
    var c1list = cand1.filter(function (c) { return ok(c, [surname.c], [surname.p]); });
    if (!c1list.length) c1list = pool.filter(function (c) { return TABOO.indexOf(c.p + c.t) < 0; });
    var g1 = c1list[Math.floor(rng() * c1list.length)];

    var c2list = pool.filter(function (c) { return ok(c, [surname.c, g1.c], [surname.p, g1.p]); });
    var scored = c2list.map(function (c2) {
      var tones = {};
      tones[surname.t] = tones[g1.t] = tones[c2.t] = 1;
      var distinct = Object.keys(tones).length;
      var score = distinct * 2 + (c2.t === 2 || c2.t === 4 ? 1 : 0) - (g1.t === 3 && c2.t === 3 ? 1 : 0);
      return { score: score, c2: c2 };
    });
    scored.sort(function (x, y) { return y.score - x.score; });
    var top = scored.slice(0, 6);
    var g2 = top[Math.floor(rng() * top.length)].c2;

    return { s: surname, g: [g1, g2] };
  }

  // ---------- render ----------
  var TAG_EN = {
    floral: "flowers & plants", tree: "trees & wood", nature: "nature", virtue: "character & virtue",
    mind: "mind & wisdom", joy: "joy", music: "music", ink: "letters & art", jade: "jade & gems",
    sky: "sky & stars", light: "light & dawn", weather: "weather", water: "water & rivers",
    sea: "sea & travel", earth: "stone & peaks", metal: "metal & craft", season: "seasons",
    animal: "auspicious animals", carriage: "dignity", legend: "legend", color: "color",
    time: "time", soft: "gentleness", speech: "words"
  };
  var CHAR_ROLES = ["your surname", "given name", "given name"];

  function cardHtml(ch, role) {
    var meaning = ch.m || "a classic Chinese surname";
    var tag = ch.tag || "surname";
    return '<div class="charcard"><span class="zi" lang="zh">' + ch.c + '</span>' +
      '<span class="zp">' + mark(ch.p, ch.t) + ch.t + '</span>' +
      '<span class="zm">' + meaning + '</span>' +
      '<span class="zt">' + (TAG_EN[tag] || tag) + ' · ' + role + '</span></div>';
  }

  var CURRENT = null; // {name, mapping}

  function show(name, mapping, fromList) {
    CURRENT = { name: name, mapping: mapping };
    var s = mapping.s, g1 = mapping.g[0], g2 = mapping.g[1];
    var chars = s.c + g1.c + g2.c;
    var py = fullPy(mapping);
    document.getElementById("result").hidden = false;
    document.getElementById("rKicker").innerHTML = "The name <strong>" + esc(name) + "</strong>, in real Chinese" +
      (fromList ? '' : ' <span style="opacity:.6">(built just for you)</span>');
    document.getElementById("rBig").textContent = chars;
    document.getElementById("rPy").textContent = py;
    document.getElementById("rCards").innerHTML =
      cardHtml(s, CHAR_ROLES[0]) + cardHtml(g1, CHAR_ROLES[1]) + cardHtml(g2, CHAR_ROLES[2]);
    document.getElementById("rWhy").innerHTML =
      "The surname " + esc(s.c) + " (" + mark(s.p, s.t) + ") is one of the classic Chinese surnames and starts with the same sound as " +
      esc(name) + ". " + esc(g1.c) + " (" + mark(g1.p, g1.t) + ") " + esc(g1.m) + ", and " + esc(g2.c) + " (" +
      mark(g2.p, g2.t) + ") " + esc(g2.m) + " — together the given name reads like a small blessing, not a transliteration.";
    var crisp = (g2.t === 2 || g2.t === 4) ? "rises and lands crisply, easy to say" : "smooth and balanced";
    document.getElementById("rTone").innerHTML =
      "Tone pattern: <strong>" + s.t + "-" + g1.t + "-" + g2.t + "</strong> — " + crisp + ".";
    var rec = NAMES_BY_KEY[name.trim().toLowerCase()];
    var link = document.getElementById("rPageLink");
    if (rec) { link.hidden = false; link.href = "name/" + rec.slug + "/"; }
    else { link.hidden = true; }
    document.getElementById("result").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  // ---------- share card ----------
  function drawCard(w, h) {
    var m = CURRENT.mapping;
    var cv = document.createElement("canvas");
    cv.width = w; cv.height = h;
    var x = cv.getContext("2d");
    var cnFont = function (px) { return px + 'px "KaiTi","STKaiti","Kaiti SC","Noto Serif SC",serif'; };
    var latFont = function (px) { return px + 'px Georgia,serif'; };

    x.fillStyle = "#faf7f0"; x.fillRect(0, 0, w, h);
    // double border
    x.strokeStyle = "#a63a2b"; x.lineWidth = Math.max(2, w * 0.0035);
    var pad = w * 0.045;
    x.strokeRect(pad, pad, w - pad * 2, h - pad * 2);
    x.lineWidth = 1;
    x.strokeRect(pad + 8, pad + 8, w - pad * 2 - 16, h - pad * 2 - 16);

    var chars = m.s.c + m.g[0].c + m.g[1].c;
    var py = fullPy(m);
    var vertical = h >= w;

    if (vertical) {
      x.fillStyle = "#6b6257"; x.font = latFont(Math.round(w * 0.028));
      x.textAlign = "center";
      x.fillText("MINGZI · 名字", w / 2, pad + w * 0.075);
      var fs = Math.min(w * 0.20, h * 0.16);
      x.fillStyle = "#2b2723"; x.font = cnFont(Math.round(fs));
      x.fillText(chars, w / 2, h * 0.42);
      x.fillStyle = "#8c2f22"; x.font = latFont(Math.round(w * 0.05));
      x.fillText(py, w / 2, h * 0.42 + fs * 0.5);
      drawSeal(x, w * 0.72, h * 0.62, w * 0.16, m);
      x.fillStyle = "#6b6257"; x.font = latFont(Math.round(w * 0.026));
      var badge = (CFG.siteUrl || "").replace(/^https?:\/\//, "").replace(/\/$/, "");
      x.fillText("Your name, in real Chinese" + (badge ? " — " + badge : ""), w / 2, h - pad - w * 0.05);
    } else {
      x.fillStyle = "#6b6257"; x.font = latFont(Math.round(h * 0.05));
      x.textAlign = "left";
      x.fillText("MINGZI · 名字", pad + h * 0.10, pad + h * 0.13);
      var fs2 = Math.min(h * 0.34, (w - h) * 0.42);
      x.fillStyle = "#2b2723"; x.font = cnFont(Math.round(fs2));
      x.fillText(chars, pad + h * 0.10, h * 0.52);
      x.fillStyle = "#8c2f22"; x.font = latFont(Math.round(h * 0.085));
      x.fillText(py, pad + h * 0.10, h * 0.52 + fs2 * 0.42);
      drawSeal(x, w - h * 0.42, h * 0.22, h * 0.22, m);
      x.fillStyle = "#6b6257"; x.font = latFont(Math.round(h * 0.045));
      var badge2 = (CFG.siteUrl || "").replace(/^https?:\/\//, "").replace(/\/$/, "");
      x.fillText("Your name, in real Chinese" + (badge2 ? " — " + badge2 : ""), pad + h * 0.10, h - pad - h * 0.06);
    }
    return cv;
  }

  function drawSeal(x, sx, sy, size, m) {
    x.save();
    x.fillStyle = "#a63a2b";
    var r = size * 0.08;
    x.beginPath();
    x.moveTo(sx + r, sy);
    x.arcTo(sx + size, sy, sx + size, sy + size, r);
    x.arcTo(sx + size, sy + size, sx, sy + size, r);
    x.arcTo(sx, sy + size, sx, sy, r);
    x.arcTo(sx, sy, sx + size, sy, r);
    x.closePath(); x.fill();
    x.strokeStyle = "#faf7f0"; x.lineWidth = Math.max(1.5, size * 0.02);
    x.strokeRect(sx + size * 0.08, sy + size * 0.08, size * 0.84, size * 0.84);
    x.fillStyle = "#faf7f0";
    x.textAlign = "center"; x.textBaseline = "middle";
    var fs = size * 0.30;
    x.font = fs + 'px "KaiTi","STKaiti","Kaiti SC","Noto Serif SC",serif';
    x.fillText(m.g[0].c, sx + size * 0.5, sy + size * 0.34);
    x.fillText(m.g[1].c, sx + size * 0.5, sy + size * 0.68);
    x.restore();
  }

  var SIZES = { portrait: [1080, 1350], story: [1080, 1920], header: [1500, 500] };
  function download(sizeKey) {
    var s = SIZES[sizeKey];
    var cv = drawCard(s[0], s[1]);
    cv.toBlob(function (blob) {
      var a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "mingzi-" + CURRENT.name.toLowerCase() + "-" + sizeKey + ".png";
      a.click();
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 4000);
    }, "image/png");
  }

  // ---------- wiring ----------
  function go() {
    var raw = document.getElementById("nameInput").value.trim();
    if (!raw) return;
    var key = raw.toLowerCase().replace(/[^a-z]/g, "");
    var rec = NAMES_BY_KEY[key];
    if (rec) {
      show(rec.name, { s: rec.s, g: rec.g }, true);
    } else {
      var gender = guessGender(raw);
      show(raw, assign(raw, gender), false);
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    Promise.all([
      fetch("data/hanzi.json").then(function (r) { return r.json(); }),
      fetch("data/names.json").then(function (r) { return r.json(); })
    ]).then(function (res) {
      HANZI = res[0]; NAMES = res[1];
      NAMES.forEach(function (n) { NAMES_BY_KEY[n.name.toLowerCase()] = n; });
      document.getElementById("goBtn").disabled = false;
    });

    var btn = document.getElementById("goBtn");
    btn.disabled = true;
    btn.addEventListener("click", go);
    document.getElementById("nameInput").addEventListener("keydown", function (e) {
      if (e.key === "Enter") go();
    });
    Array.prototype.forEach.call(document.querySelectorAll("[data-size]"), function (b) {
      b.addEventListener("click", function () { download(b.getAttribute("data-size")); });
    });

    // config-driven links
    if (CFG.storeUrl) {
      Array.prototype.forEach.call(document.querySelectorAll(".js-store"), function (a) {
        a.href = CFG.storeUrl;
        a.target = "_blank"; a.rel = "noopener";
      });
    } else {
      Array.prototype.forEach.call(document.querySelectorAll(".js-store"), function (a) {
        a.href = "#waitlist";
      });
    }
    var form = document.getElementById("wlForm");
    if (CFG.waitlistUrl) {
      form.action = CFG.waitlistUrl;
    } else if (CFG.contactEmail) {
      form.action = "https://formsubmit.co/" + CFG.contactEmail;
    } else {
      form.addEventListener("submit", function (e) { e.preventDefault(); });
      document.getElementById("wlNote").textContent = "The waitlist opens with the shop.";
    }
  });
})();
