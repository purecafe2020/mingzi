/* quiz.js — Moon Maiden quiz flow: name → 16 questions → moon phase + 3 candidate names. */
(function () {
  "use strict";

  var CFG = window.MINGZI_CONFIG || {};
  var MOON = null, HANZI = null;
  var NAME = "", GENDER = null, ANSWERS = [], QI = 0, RESULT = null;
  var TAG_EN = {
    floral: "flowers & plants", tree: "trees & wood", nature: "nature", virtue: "character & virtue",
    mind: "mind & wisdom", joy: "joy", music: "music", ink: "letters & art", jade: "jade & gems",
    sky: "sky & stars", light: "light & dawn", weather: "weather", water: "water & rivers",
    sea: "sea & travel", earth: "stone & peaks", metal: "metal & craft", season: "seasons",
    animal: "auspicious animals", carriage: "dignity", legend: "legend", color: "color",
    time: "time", soft: "gentleness", speech: "words"
  };

  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }

  function guessGender(n) {
    return /(a|e|i|y|ie|elle|ine|ana|ina|ella|lyn)$/.test(n.toLowerCase()) ? "F" : "M";
  }

  function startQuiz() {
    var raw = document.getElementById("nameInput").value.trim();
    if (!raw) { document.getElementById("nameInput").focus(); return; }
    NAME = raw;
    GENDER = guessGender(raw);
    ANSWERS = []; QI = 0;
    document.getElementById("intro").hidden = true;
    document.getElementById("quiz").hidden = false;
    renderQuestion();
    document.getElementById("quiz").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function renderQuestion() {
    var q = MOON.questions[QI];
    document.getElementById("qProgress").textContent = "Question " + (QI + 1) + " of " + MOON.questions.length;
    document.getElementById("qText").textContent = q.q;
    document.getElementById("optA").textContent = q.A;
    document.getElementById("optB").textContent = q.B;
    document.getElementById("qBackWrap").hidden = QI === 0;
  }

  function answer(choice) {
    ANSWERS[QI] = choice;
    QI++;
    if (QI < MOON.questions.length) { renderQuestion(); return; }
    finish();
  }

  function finish() {
    RESULT = MoonCore.result(NAME, GENDER, ANSWERS, MOON, HANZI);
    document.getElementById("quiz").hidden = true;
    var R = document.getElementById("moonResult");
    R.hidden = false;

    document.getElementById("mKicker").innerHTML =
      "For <strong>" + esc(RESULT.name) + "</strong> (" + RESULT.type + "), 望舒 read the sky as —";
    document.getElementById("mCn").textContent = RESULT.moon.cn;
    document.getElementById("mEn").textContent = RESULT.moon.en + " · " + RESULT.moon.epithet;
    document.getElementById("mTraits").textContent = RESULT.moon.traits;
    drawMoon(RESULT.moonId);

    var cards = RESULT.candidates.map(function (m) {
      var role = m.kind === "fit" ? "fits your nature" : "balances your nature";
      var full = m.s.c + m.g[0].c + m.g[1].c;
      return '<div class="charcard wide"><p class="nm" lang="zh">' + esc(full) + '</p>' +
        '<p class="zp">' + MoonCore.fullPy(m) + '</p>' +
        '<p class="zm">' + esc(m.g[0].m) + " · " + esc(m.g[1].m) + '</p>' +
        '<p class="zt">' + esc(role) + ' — ' + esc(m.kind === "fit" ? RESULT.moon.fitNote : RESULT.moon.counterNote) + '</p></div>';
    });
    document.getElementById("nameCards").innerHTML = cards.join("");
    R.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function drawMoon(id) {
    var cv = document.getElementById("moonCanvas"), x = cv.getContext("2d");
    x.clearRect(0, 0, 140, 140);
    var GOLD = "#e8b64c", DARK = "#2b2723";
    x.fillStyle = GOLD; x.beginPath(); x.arc(70, 70, 52, 0, 7); x.fill();
    function shadow(dx, rx) {
      x.fillStyle = DARK; x.beginPath(); x.ellipse(70 + dx, 70, rx, 52, 0, 0, 7); x.fill();
    }
    if (id === "new") { shadow(0, 52); }
    else if (id === "crescentW") { shadow(-30, 46); }
    else if (id === "firstQ") { shadow(-52, 52); }
    else if (id === "gibbousWax") { shadow(-38, 24); }
    else if (id === "gibbousW") { shadow(38, 24); }
    else if (id === "lastQ") { shadow(52, 52); }
    else if (id === "crescentWan") { shadow(30, 46); }
    // full moon: no shadow
  }

  // moon + name share card
  function drawCard(w, h) {
    var cv = document.createElement("canvas"); cv.width = w; cv.height = h;
    var x = cv.getContext("2d");
    var cnFont = function (px) { return px + 'px "KaiTi","STKaiti","Kaiti SC","Noto Serif SC",serif'; };
    var latFont = function (px) { return px + 'px Georgia,serif'; };
    x.fillStyle = "#faf7f0"; x.fillRect(0, 0, w, h);
    var pad = w * 0.045;
    x.strokeStyle = "#a63a2b"; x.lineWidth = Math.max(2, w * 0.0035);
    x.strokeRect(pad, pad, w - pad * 2, h - pad * 2);
    x.textAlign = "center";
    x.fillStyle = "#6b6257"; x.font = latFont(Math.round(w * 0.028));
    x.fillText("MINGZI · THE MOON MAIDEN 望舒", w / 2, pad + w * 0.075);
    var fs = Math.min(w * 0.16, h * 0.12);
    x.fillStyle = "#2b2723"; x.font = cnFont(Math.round(fs));
    x.fillText(RESULT.moon.cn + " · " + RESULT.candidates[0].s.c + RESULT.candidates[0].g[0].c + RESULT.candidates[0].g[1].c, w / 2, h * 0.40);
    x.fillStyle = "#8c2f22"; x.font = latFont(Math.round(w * 0.042));
    x.fillText(RESULT.moon.en + " — for " + RESULT.name, w / 2, h * 0.40 + fs * 0.55);
    drawSeal(x, w * 0.5, h * 0.62, w * 0.15);
    var badge = (CFG.siteUrl || "").replace(/^https?:\/\//, "").replace(/\/$/, "");
    x.fillStyle = "#6b6257"; x.font = latFont(Math.round(w * 0.026));
    x.fillText(badge || "your name, in real Chinese", w / 2, h - pad - w * 0.05);
    return cv;
  }
  function drawSeal(x, sx, sy, size) {
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
    x.fillStyle = "#faf7f0"; x.textBaseline = "middle";
    x.font = Math.round(size * 0.34) + 'px "KaiTi","STKaiti","Kaiti SC","Noto Serif SC",serif';
    x.fillText(RESULT.moon.cn, sx + size / 2, sy + size / 2);
    x.restore();
  }
  var SIZES = { portrait: [1080, 1350], story: [1080, 1920] };
  function download(sizeKey) {
    var s = SIZES[sizeKey];
    drawCard(s[0], s[1]).toBlob(function (blob) {
      var a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "mingzi-moon-" + RESULT.name.toLowerCase() + "-" + sizeKey + ".png";
      a.click();
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 4000);
    }, "image/png");
  }

  document.addEventListener("DOMContentLoaded", function () {
    Promise.all([
      fetch("data/moon.json").then(function (r) { return r.json(); }),
      fetch("data/hanzi.json").then(function (r) { return r.json(); })
    ]).then(function (res) {
      MOON = res[0]; HANZI = res[1];
      var b = document.getElementById("startBtn");
      b.disabled = false;
      b.addEventListener("click", startQuiz);
      document.getElementById("nameInput").addEventListener("keydown", function (e) { if (e.key === "Enter") startQuiz(); });
    });
    document.getElementById("optA").addEventListener("click", function () { answer("a"); });
    document.getElementById("optB").addEventListener("click", function () { answer("b"); });
    document.getElementById("qBack").addEventListener("click", function (e) {
      e.preventDefault();
      if (QI > 0) { QI--; ANSWERS.length = QI; renderQuestion(); }
    });
    Array.prototype.forEach.call(document.querySelectorAll("[data-size]"), function (b) {
      b.addEventListener("click", function () { download(b.getAttribute("data-size")); });
    });
  });
})();
