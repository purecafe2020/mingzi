/* wuxing-quiz.js — Five Natures (五行) quiz flow, mirroring quiz.js structure. */
(function () {
  "use strict";

  var CFG = window.MINGZI_CONFIG || {};
  var WX = null, HANZI = null;
  var NAME = "", GENDER = null, ANSWERS = [], QI = 0, RESULT = null;

  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
  function guessGender(n) {
    return /(a|e|i|y|ie|elle|ine|ana|ina|ella|lyn)$/.test(n.toLowerCase()) ? "F" : "M";
  }

  function startQuiz() {
    var raw = document.getElementById("nameInput").value.trim();
    if (!raw) { document.getElementById("nameInput").focus(); return; }
    NAME = raw; GENDER = guessGender(raw); ANSWERS = []; QI = 0;
    document.getElementById("intro").hidden = true;
    document.getElementById("quiz").hidden = false;
    renderQuestion();
    document.getElementById("quiz").scrollIntoView({ behavior: "smooth", block: "start" });
  }
  function renderQuestion() {
    var q = WX.questions[QI];
    document.getElementById("qProgress").textContent = "Question " + (QI + 1) + " of " + WX.questions.length;
    document.getElementById("qText").textContent = q.q;
    document.getElementById("optA").textContent = q.A;
    document.getElementById("optB").textContent = q.B;
    document.getElementById("qBackWrap").hidden = QI === 0;
  }
  function answer(choice) {
    ANSWERS[QI] = choice; QI++;
    if (QI < WX.questions.length) { renderQuestion(); return; }
    finish();
  }
  function finish() {
    RESULT = WuxingCore.result(NAME, GENDER, ANSWERS, WX, HANZI);
    document.getElementById("quiz").hidden = true;
    var R = document.getElementById("wxResult");
    R.hidden = false;
    document.getElementById("wKicker").innerHTML =
      "For <strong>" + esc(RESULT.name) + "</strong>, 望舒 read the five — your nature is:";
    document.getElementById("wCn").textContent = RESULT.element.cn + "命";
    document.getElementById("wEn").textContent = RESULT.element.en + " Nature · " + RESULT.element.epithet;
    document.getElementById("wTraits").textContent = RESULT.element.traits;
    drawElement(RESULT.elementId);

    if (RESULT.fitName) {
      var m = RESULT.fitName;
      document.getElementById("nameCards").innerHTML =
        '<div class="charcard wide"><p class="nm" lang="zh">' + esc(m.s.c + m.g[0].c + m.g[1].c) + '</p>' +
        '<p class="zp">' + WuxingCore.fullPy(m) + '</p>' +
        '<p class="zm">' + esc(m.g[0].m) + " · " + esc(m.g[1].m) + '</p>' +
        '<p class="zt">walks with your ' + esc(RESULT.element.en) + ' nature</p></div>';
    }
    R.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  var GLYPH = { wood: "木", fire: "火", earth: "土", metal: "金", water: "水" };
  var COLOR = { wood: "#4f7d4f", fire: "#b03a2e", earth: "#8a6f3d", metal: "#9aa2ab", water: "#2e5f8a" };
  function drawElement(id) {
    var cv = document.getElementById("elCanvas"), x = cv.getContext("2d");
    x.clearRect(0, 0, 140, 140);
    x.fillStyle = "#a63a2b";
    var r = 8;
    x.beginPath();
    x.moveTo(14 + r, 14); x.arcTo(126, 14, 126, 126, r); x.arcTo(126, 126, 14, 126, r);
    x.arcTo(14, 126, 14, 14, r); x.arcTo(14, 14, 126, 14, r); x.closePath(); x.fill();
    x.strokeStyle = "#faf7f0"; x.lineWidth = 2;
    x.strokeRect(24, 24, 92, 92);
    x.fillStyle = "#faf7f0"; x.textAlign = "center"; x.textBaseline = "middle";
    x.font = '56px "KaiTi","STKaiti","Kaiti SC","Noto Serif SC",serif';
    x.fillText(GLYPH[id], 70, 72);
  }

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
    x.fillText("MINGZI · THE FIVE NATURES 五行", w / 2, pad + w * 0.075);
    var fs = Math.min(w * 0.15, h * 0.11);
    x.fillStyle = "#2b2723"; x.font = cnFont(Math.round(fs));
    x.fillText(RESULT.element.cn + "命 · " + RESULT.fitName.s.c + RESULT.fitName.g[0].c + RESULT.fitName.g[1].c, w / 2, h * 0.40);
    x.fillStyle = "#8c2f22"; x.font = latFont(Math.round(w * 0.042));
    x.fillText(RESULT.element.en + " Nature — for " + RESULT.name, w / 2, h * 0.40 + fs * 0.55);
    var badge = (CFG.siteUrl || "").replace(/^https?:\/\//, "").replace(/\/$/, "");
    x.fillStyle = "#6b6257"; x.font = latFont(Math.round(w * 0.026));
    x.fillText(badge || "your name, in real Chinese", w / 2, h - pad - w * 0.05);
    return cv;
  }
  var SIZES = { portrait: [1080, 1350], story: [1080, 1920] };
  function download(sizeKey) {
    var s = SIZES[sizeKey];
    drawCard(s[0], s[1]).toBlob(function (blob) {
      var a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "mingzi-wuxing-" + RESULT.name.toLowerCase() + "-" + sizeKey + ".png";
      a.click();
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 4000);
    }, "image/png");
  }

  document.addEventListener("DOMContentLoaded", function () {
    Promise.all([
      fetch("data/wuxing.json").then(function (r) { return r.json(); }),
      fetch("data/hanzi.json").then(function (r) { return r.json(); })
    ]).then(function (res) {
      WX = res[0]; HANZI = res[1];
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
