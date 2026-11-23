/* moon-core.js — pure scoring/naming logic for the Moon Maiden quiz.
   Shared by the front-end quiz and testable from Node (CommonJS export at bottom). */
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

  // answers: array of "a"/"b" (per question order) → 4-letter type
  var AXIS_OF = { EI: "EI", IE: "EI", NS: "NS", SN: "NS", TF: "TF", FT: "TF", JP: "JP", PJ: "JP" };
  function scoreAnswers(answers, moonData) {
    var qs = moonData.questions;
    var counts = { EI: {}, NS: {}, TF: {}, JP: {} };
    for (var i = 0; i < qs.length; i++) {
      var q = qs[i];
      var axis = AXIS_OF[q.pa + q.pb];
      var letter = answers[i] === "a" ? q.pa : q.pb;
      counts[axis][letter] = (counts[axis][letter] || 0) + 1;
    }
    var tb = { EI: "E", NS: "S", TF: "T", JP: "J" };
    function letterFor(axis, l1, l2, tie) {
      var a = counts[axis][l1] || 0, b = counts[axis][l2] || 0;
      if (a > b) return l1;
      if (b > a) return l2;
      return tie;
    }
    return letterFor("EI", "E", "I", tb.EI)
      + letterFor("NS", "N", "S", tb.NS)
      + letterFor("TF", "T", "F", tb.TF)
      + letterFor("JP", "J", "P", tb.JP);
  }
  function qsLenPerAxis(moonData) { return moonData.questions.length; }

  function moonForType(type, moonData) {
    var id = moonData.typeToMoon[type] || "full";
    return { id: id, moon: moonData.moons[id] };
  }

  function genderOf(name, known) {
    if (known) return known;
    var n = name.toLowerCase();
    return /(a|e|i|y|ie|elle|ine|ana|ina|ella|lyn)$/.test(n) ? "F" : "M";
  }

  function poolFor(gender, chars) {
    return chars.filter(function (c) {
      return gender === "F" ? (c.g === "F" || c.g === "N") : (c.g === "M" || c.g === "N");
    });
  }

  function pickName(rng, surname, tags, pool, usedChars, usedPys) {
    var taboo = TABOO;
    function eligible(c) {
      return usedChars.indexOf(c.c) < 0 && usedPys.indexOf(c.p) < 0 && taboo.indexOf(c.p + c.t) < 0;
    }
    var tagged = tags.map(function (t) {
      return pool.filter(function (c) { return c.tag === t && eligible(c); });
    });
    var flat = [];
    tagged.forEach(function (arr) { flat = flat.concat(arr); });
    if (flat.length < 8) {
      flat = pool.filter(function (c) { return eligible(c); });
    }
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

  // returns { type, moonId, moon, candidates: [{kind, s, g}] } — 2 fitting + 1 counter
  function result(name, gender, answers, moonData, hanziData) {
    var key = name.trim().toLowerCase();
    var type = scoreAnswers(answers, moonData);
    var info = moonForType(type, moonData);
    var moon = info.moon;
    var g = genderOf(name, gender);
    var rng = mulberry32(fnv1a(key + "|" + info.id));
    var initial = key[0] && hanziData.surnames[key[0]] ? key[0] : "l";
    var surname = hanziData.surnames[initial][Math.floor(rng() * hanziData.surnames[initial].length)];
    var pool = poolFor(g, hanziData.chars);

    var candidates = [];
    var usedChars = [surname.c], usedPys = [surname.p];

    for (var k = 0; k < 2; k++) {
      var m = pickName(rng, surname, moon.fit, pool, usedChars, usedPys);
      if (!m) break;
      m.kind = "fit";
      m.g.forEach(function (c) { usedChars.push(c.c); usedPys.push(c.p); });
      candidates.push(m);
    }
    var mc = pickName(rng, surname, moon.counter, pool, usedChars, usedPys);
    if (mc) { mc.kind = "counter"; mc.g.forEach(function (c) { usedChars.push(c.c); usedPys.push(c.p); }); candidates.push(mc); }

    return { name: name, gender: g, type: type, moonId: info.id, moon: moon, candidates: candidates };
  }

  var api = {
    fnv1a: fnv1a,
    mulberry32: mulberry32,
    mark: mark,
    fullPy: fullPy,
    scoreAnswers: scoreAnswers,
    moonForType: moonForType,
    result: result
  };

  if (typeof module !== "undefined" && module.exports) { module.exports = api; }
  else { root.MoonCore = api; }
})(typeof window !== "undefined" ? window : globalThis);
