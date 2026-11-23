/* zodiac-quiz.js — birthday → sign × animal → name. Instant, no questions. */
(function () {
  "use strict";

  var CFG = window.MINGZI_CONFIG || {};
  var ZX = null, HANZI = null, RESULT = null;

  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
  function guessGender(n) {
    return /(a|e|i|y|ie|elle|ine|ana|ina|ella|lyn)$/.test(n.toLowerCase()) ? "F" : "M";
  }

  function go() {
    var raw = document.getElementById("nameInput").value.trim();
    var date = document.getElementById("dateInput").value;
    if (!raw || !date) { return; }
    RESULT = ZodiacCore.result(raw, null, date, ZX, HANZI);
    var R = document.getElementById("zoResult");
    R.hidden = false;

    var monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    var d = date.split("-").map(Number);
    document.getElementById("zKicker").innerHTML =
      "For <strong>" + esc(RESULT.name) + "</strong>, born " + monthNames[d[1] - 1] + " " + d[2] + ", " + d[0] + " — 望舒 read both skies:";
    document.getElementById("zSign").textContent = RESULT.sign.cn;
    document.getElementById("zSignEn").textContent = RESULT.sign.en + " · " + RESULT.element.cn + " (" +
      ({ fire: "Fire", earth: "Earth", air: "Air", water: "Water" })[RESULT.elementId] + ")";
    document.getElementById("zLine").textContent = RESULT.sign.line;
    document.getElementById("zAnimal").innerHTML =
      "Year of the <strong>" + esc(RESULT.animal.en) + "</strong> <span lang=\"zh\">" + esc(RESULT.animal.cn) +
      "</span> — " + esc(RESULT.animal.line) + ".";
    drawBadge(RESULT);

    if (RESULT.fitName) {
      var m = RESULT.fitName;
      document.getElementById("nameCards").innerHTML =
        '<div class="charcard wide"><p class="nm" lang="zh">' + esc(m.s.c + m.g[0].c + m.g[1].c) + '</p>' +
        '<p class="zp">' + ZodiacCore.fullPy(m) + '</p>' +
        '<p class="zm">' + esc(m.g[0].m) + " · " + esc(m.g[1].m) + '</p>' +
        '<p class="zt">carries your ' + esc(RESULT.sign.en) + ' sky and your ' + esc(RESULT.animal.en) + ' year</p></div>';
    }
    R.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function drawBadge(r) {
    var cv = document.getElementById("zoCanvas"), x = cv.getContext("2d");
    x.clearRect(0, 0, 140, 140);
    x.fillStyle = "#a63a2b";
    x.beginPath();
    x.moveTo(22, 14); x.arcTo(126, 14, 126, 126, 8); x.arcTo(126, 126, 14, 126, 8);
    x.arcTo(14, 126, 14, 14, 8); x.arcTo(14, 14, 126, 14, 8); x.closePath(); x.fill();
    x.strokeStyle = "#faf7f0"; x.lineWidth = 2;
    x.strokeRect(24, 24, 92, 92);
    x.fillStyle = "#faf7f0"; x.textAlign = "center"; x.textBaseline = "middle";
    x.font = '30px "KaiTi","STKaiti","Kaiti SC","Noto Serif SC",serif';
    x.fillText(r.sign.cn, 70, 48);
    x.font = '44px "KaiTi","STKaiti","Kaiti SC","Noto Serif SC",serif';
    x.fillText(r.animal.cn, 70, 95);
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
    x.fillText("MINGZI · TWO SKIES, ONE NAME", w / 2, pad + w * 0.075);
    var fs = Math.min(w * 0.14, h * 0.11);
    x.fillStyle = "#2b2723"; x.font = cnFont(Math.round(fs));
    x.fillText(RESULT.animal.cn + " · " + RESULT.fitName.s.c + RESULT.fitName.g[0].c + RESULT.fitName.g[1].c, w / 2, h * 0.40);
    x.fillStyle = "#8c2f22"; x.font = latFont(Math.round(w * 0.04));
    x.fillText(RESULT.sign.en + " · Year of the " + RESULT.animal.en + " — for " + RESULT.name, w / 2, h * 0.40 + fs * 0.55);
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
      a.download = "mingzi-zodiac-" + RESULT.name.toLowerCase() + "-" + sizeKey + ".png";
      a.click();
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 4000);
    }, "image/png");
  }

  document.addEventListener("DOMContentLoaded", function () {
    Promise.all([
      fetch("data/zodiac.json").then(function (r) { return r.json(); }),
      fetch("data/hanzi.json").then(function (r) { return r.json(); })
    ]).then(function (res) {
      ZX = res[0]; HANZI = res[1];
      var b = document.getElementById("startBtn");
      b.disabled = false;
      b.addEventListener("click", go);
      ["nameInput", "dateInput"].forEach(function (id) {
        document.getElementById(id).addEventListener("keydown", function (e) { if (e.key === "Enter") go(); });
      });
    });
    Array.prototype.forEach.call(document.querySelectorAll("[data-size]"), function (b) {
      b.addEventListener("click", function () { download(b.getAttribute("data-size")); });
    });
  });
})();
