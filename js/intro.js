// ---------- Сценарий заставки ----------
// Анимирует надпись при заходе, затем запускает карусель (startCarousel из carousel.js).
(function () {
  var intro = document.getElementById("intro");
  var started = false;

  function startSite() { if (started) return; started = true; startCarousel(); }
  var calm = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!intro || calm) { if (intro) intro.classList.add("static"); startSite(); return; }

  // Переход при прокрутке: --p уводит надпись, __stageIn поднимает сцену с банками
  var stageEl = document.getElementById("stage");
  Array.prototype.forEach.call(intro.querySelectorAll(".ltr"), function (el, i) {
    el.style.setProperty("--dx", (i - 3) * 70);
    el.style.setProperty("--dy", -(50 + (i % 3) * 45));
    el.style.setProperty("--sp", (i - 3) * 13);
  });
  var pT = 0, pS = 0, qT = 1, qS = 1, raf = 0;
  function clamp01(x) { return Math.max(0, Math.min(1, x)); }
  function measure() {
    var y = window.pageYOffset || document.documentElement.scrollTop || 0;
    pT = clamp01(y / (intro.offsetHeight || window.innerHeight));
    qT = clamp01((window.innerHeight - stageEl.getBoundingClientRect().top) / (window.innerHeight * 0.85));
  }
  function tick() {
    measure();
    pS += (pT - pS) * 0.16; qS += (qT - qS) * 0.16;
    if (Math.abs(pT - pS) < 0.001) pS = pT;
    if (Math.abs(qT - qS) < 0.001) qS = qT;
    intro.style.setProperty("--p", pS.toFixed(4));
    window.__stageIn = qS;
    raf = (pS !== pT || qS !== qT) ? requestAnimationFrame(tick) : 0;
  }
  function kick() { if (pT > 0.01) startSite(); if (!raf) raf = requestAnimationFrame(tick); } // пользователь листает — сцены нужны сейчас
  measure(); pS = pT; qS = qT; window.__stageIn = qS; intro.style.setProperty("--p", pS.toFixed(4));
  window.addEventListener("scroll", kick, { passive: true });
  window.addEventListener("resize", kick);

  function run() {
    // Буквы обрушиваются сверху с размаху: огромные и размытые -> удар со сплющиванием -> отскок.
    // На каждом ударе буква вспыхивает, а слово вздрагивает.
    var word = intro.querySelector(".word"), ltrs = intro.querySelectorAll(".ltr");
    function shake(a) {
      return [{ transform: "translate(0,0)" }, { transform: "translate(" + -a + "px," + a * 0.6 + "px)" },
        { transform: "translate(" + a * 0.8 + "px," + -a * 0.5 + "px)" }, { transform: "translate(" + -a * 0.4 + "px,0)" }, { transform: "translate(0,0)" }];
    }
    var LD = 520, LS = 80, L0 = 300;
    Array.prototype.forEach.call(ltrs, function (el, i) {
      var rot = parseFloat(el.getAttribute("data-rot")) || 0, spin = (i % 2 ? 1 : -1) * (20 + i * 4), delay = L0 + i * LS;
      el.animate([
        { transform: "translateY(-42vh) scale(3.4) rotate(" + (rot + spin) + "deg)", opacity: 0, offset: 0 },
        { transform: "translateY(0) scale(1.38,.6) rotate(" + (rot - spin * 0.12) + "deg)", opacity: 1, offset: 0.55 }, // удар
        { transform: "translateY(-12px) scale(.86,1.2) rotate(" + (rot + 5) + "deg)", opacity: 1, offset: 0.76 },
        { transform: "translateY(0) scale(1) rotate(" + rot + "deg)", opacity: 1, offset: 1 }
      ], { duration: LD, delay: delay, easing: "cubic-bezier(.6,0,.25,1)", fill: "both" });
      setTimeout(function () {
        el.querySelector(".glyph").animate([{ color: "#ffd0d8" }, { color: "#db0a40" }], { duration: 240 });
        word.animate(shake(6), { duration: 150 });
      }, delay + LD * 0.55);
    });

    // Финальный удар всем словом: рывок, ударная волна, красная вспышка и тряска экрана
    var slam = L0 + (ltrs.length - 1) * LS + LD * 0.55 + 140;
    setTimeout(function () {
      word.animate([{ transform: "scale(1)" }, { transform: "scale(1.13)" }, { transform: "scale(.97)" }, { transform: "scale(1)" }],
        { duration: 420, easing: "cubic-bezier(.2,.9,.3,1)" });
      intro.querySelector(".intro-main").animate(shake(14), { duration: 320 });
      var wave = document.createElement("span"); wave.className = "shock"; word.appendChild(wave);
      wave.animate([
        { transform: "translate(-50%,-50%) scale(.2)", opacity: 0.9 },
        { transform: "translate(-50%,-50%) scale(5.5)", opacity: 0 }
      ], { duration: 750, easing: "cubic-bezier(.1,.7,.3,1)" }).onfinish = function () { wave.remove(); };
      var flash = document.createElement("span"); flash.className = "rage-flash"; intro.appendChild(flash);
      flash.animate([{ opacity: 0 }, { opacity: 1, offset: 0.15 }, { opacity: 0 }], { duration: 480 }).onfinish = function () { flash.remove(); };
    }, slam);

    // Потом — короткие «глитчи»: буквы на миг дёргаются и перекашиваются
    setInterval(function () {
      if (!intro.classList.contains("idle") || document.hidden || (window.pageYOffset || 0) > intro.offsetHeight) return;
      Array.prototype.forEach.call(intro.querySelectorAll(".glyph"), function (g) {
        var dx = (Math.random() - 0.5) * 14, dy = (Math.random() - 0.5) * 8, k = (Math.random() - 0.5) * 16;
        g.animate([{ transform: "none" }, { transform: "translate(" + dx + "px," + dy + "px) skewX(" + k + "deg)" }, { transform: "translate(" + -dx * 0.5 + "px,0)" }, { transform: "none" }],
          { duration: 170, easing: "steps(4)" });
      });
    }, 3600);
    intro.querySelector(".sub span").animate([{ transform: "translateY(110%)" }, { transform: "none" }],
      { duration: 850, delay: 1500, easing: "cubic-bezier(.2,.8,.2,1)", fill: "both" });
    intro.querySelector(".strip").animate([{ opacity: 0 }, { opacity: 1 }], { duration: 600, delay: 900, fill: "both" });

    // Сначала восходит солнце, потом быки галопом сбегаются на него (js/bulls.js)
    if (window.Bulls) Bulls.run(1350); // солнце встаёт сразу после удара слова
    // 3D-сцены готовим после заставки: их сборка занимает сотни миллисекунд и дёргала анимацию букв и быков
    setTimeout(startSite, 3600);
    Array.prototype.forEach.call(intro.querySelectorAll('a[href="#catalog"]'), function (a) { a.addEventListener("click", startSite); });
    setTimeout(function () { intro.classList.add("idle"); }, 2900);
  }

  var fams = ['900 64px Jost', '700 64px Unbounded'];
  var ready = (document.fonts && document.fonts.load)
    ? Promise.race([Promise.all(fams.map(function (f) { return document.fonts.load(f, "Red Bull energy drinks"); })), new Promise(function (r) { setTimeout(r, 1500); })])
    : Promise.resolve();
  ready.then(run, run);
})();
