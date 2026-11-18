/* zodiac-core.js — Western sign × Chinese animal → names. Node-testable. */
(function (root) {
  "use strict";

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
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  var VOWELS = { a: "āáǎà", o: "ōóǒò", e: "ēéěè", i: "īíǐì", u: "ūúǔù", v: "ǖǘǚǜ" };
  function mark(syl, tone) {
    var v, i;
    for (i = 0; i < 3; i++) { v = "aoe"[i]; if (syl.indexOf(v) >= 0) return syl.replace(v, VOWELS[v][tone - 1]); }
    for (i = 0; i < 2; i++) { v = ["iu", "ui"][i]; if (syl.indexOf(v) >= 0) return syl.replace(v[v.length - 1], VOWELS[v[v.length - 1]][tone - 1]); }
    for (i = syl.length - 1; i >= 0; i--) { if (VOWELS[syl[i]]) return syl.replace(syl[i], VOWELS[syl[i]][tone - 1]); }
    return syl;
  }
  function fullPy(m) {
    return [m.s, m.g[0], m.g[1]].map(function (x) { return mark(x.p, x.t); }).join(" ");
  }
  var TABOO = ["si3", "si4", "gui3", "bing4", "dao4", "sha1", "ku1", "ku4", "lei4", "shu1"];

  function signForDate(month, day, zx) {
    for (var i = 0; i < zx.signs.length; i++) {
      var s = zx.signs[i];
      var afterFrom = (month === s.from[0] && day >= s.from[1]);
      var beforeTo = (month === s.to[0] && day <= s.to[1]);
      if (afterFrom || beforeTo) {
        // guard: only match when the month pair makes sense (handles capricorn wrap)
        if (s.from[0] === s.to[0] && month === s.from[0]) return s;
        if (s.from[0] !== s.to[0] && (month === s.from[0] || month === s.to[0])) return s;
      }
    }
    return zx.signs[11];
  }

  function animalForYear(year) {
    var animals = ["鼠", "牛", "虎", "兔", "龙", "蛇", "马", "羊", "猴", "鸡", "狗", "猪"];
    return animals[((year - 1900) % 12 + 12) % 12];
  }

  function genderOf(name, known) {
    if (known) return known;
    var n = name.toLowerCase();
    return /(a|e|i|y|ie|elle|ine|ana|ina|ella|lyn)$/.test(n) ? "F" : "M";
  }

  function pickName(rng, surname, tags, pool, usedChars, usedPys) {
    function eligible(c) {
      return usedChars.indexOf(c.c) < 0 && usedPys.indexOf(c.p) < 0 && TABOO.indexOf(c.p + c.t) < 0;
    }
    var flat = [];
    tags.forEach(function (t) {
      flat = flat.concat(pool.filter(function (c) { return c.tag === t && eligible(c); }));
    });
    if (flat.length < 8) flat = pool.filter(function (c) { return eligible(c); });
    if (flat.length < 2) return null;
    var g1 = flat[Math.floor(rng() * flat.length)];
    var rest = flat.filter(function (c) { return c.c !== g1.c && c.p !== g1.p && eligible(c); });
    if (!rest.length) rest = flat.filter(function (c) { return c.c !== g1.c; });
    if (!rest.length) return null;
    var scored = rest.map(function (c2) {
      var tones = {}; tones[surname.t] = tones[g1.t] = tones[c2.t] = 1;
      var distinct = Object.keys(tones).length;
      var score = distinct * 2 + (c2.t === 2 || c2.t === 4 ? 1 : 0) - (g1.t === 3 && c2.t === 3 ? 1 : 0);
      return { score: score, c2: c2 };
    });
    scored.sort(function (x, y) { return y.score - x.score; });
    var top = scored.slice(0, 6);
    var g2 = top[Math.floor(rng() * top.length)].c2;
    return { s: surname, g: [g1, g2] };
  }

  // dateStr: "YYYY-MM-DD" (or "YYYY-M-D")
  function result(name, gender, dateStr, zx, hanziData) {
    var parts = dateStr.split("-").map(Number);
    var year = parts[0], month = parts[1], day = parts[2];
    var sign = signForDate(month, day, zx);
    var el = zx.elements[sign.element];
    var balEl = zx.elements[el.balance];
    var animalCn = animalForYear(year);
    var animal = null;
    for (var i = 0; i < zx.animals.length; i++) {
      if (zx.animals[i].cn === animalCn) { animal = zx.animals[i]; break; }
    }
    var key = name.trim().toLowerCase();
    var g = genderOf(name, gender);
    var rng = mulberry32(fnv1a(key + "|" + sign.id + "|" + animalCn));
    var initial = key[0] && hanziData.surnames[key[0]] ? key[0] : "l";
    var surname = hanziData.surnames[initial][Math.floor(rng() * hanziData.surnames[initial].length)];
    var pool = hanziData.chars.filter(function (c) {
      return g === "F" ? (c.g === "F" || c.g === "N") : (c.g === "M" || c.g === "N");
    });
    var usedChars = [surname.c], usedPys = [surname.p];
    var fitName = pickName(rng, surname, el.tags, pool, usedChars, usedPys);
    if (fitName) { fitName.g.forEach(function (c) { usedChars.push(c.c); usedPys.push(c.p); }); }
    var balanceName = pickName(rng, surname, balEl.tags, pool, usedChars, usedPys);
    return {
      name: name, gender: g, year: year, sign: sign, element: el, elementId: sign.element,
      animal: animal, fitName: fitName, balanceElement: balEl, balanceName: balanceName
    };
  }

  var api = { signForDate: signForDate, animalForYear: animalForYear, result: result, mark: mark, fullPy: fullPy };
  if (typeof module !== "undefined" && module.exports) { module.exports = api; }
  else { root.ZodiacCore = api; }
})(typeof window !== "undefined" ? window : globalThis);
