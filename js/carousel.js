// 3D-карусель банок на three.js (r149). Список вкусов — в flavors.js.
function startCarousel() {
  var N = FLAVORS.length;
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var stage = document.getElementById("stage");
  var canvas = document.getElementById("gl");
  var fallback = document.getElementById("fallback");
  var copy = document.getElementById("copy");
  var dotsEl = document.getElementById("dots");

  var tgt = 0, cur = 0;

  function mod(i) { return ((i % N) + N) % N; }
  function goBy(d) { tgt += d; sync(); }
  function goTo(i) {
    var d = mod(i - tgt);
    if (d > N / 2) d -= N;
    tgt += d; sync();
  }

  // ---------- Информационная панель ----------
  FLAVORS.forEach(function (f, i) {
    var b = document.createElement("button");
    b.type = "button"; b.className = "dot"; b.setAttribute("aria-label", f.name);
    b.innerHTML = '<i style="background:' + f.base + '"></i>';
    b.addEventListener("click", function () { goTo(i); });
    dotsEl.appendChild(b);
  });

  var accentTar = null;
  function sync() {
    var f = FLAVORS[mod(tgt)];
    document.getElementById("ftag").textContent = f.tag;
    document.getElementById("fname").textContent = f.name;
    document.getElementById("fdesc").textContent = f.desc;
    document.getElementById("facts").innerHTML =
      "<div><dt>Volume</dt><dd>" + f.vol + "</dd></div>" +
      "<div><dt>Caffeine</dt><dd>" + f.caf + "</dd></div>" +
      "<div><dt>Sugar</dt><dd>" + f.sugar + "</dd></div>";
    Array.prototype.forEach.call(dotsEl.children, function (d, i) {
      d.setAttribute("aria-current", i === mod(tgt) ? "true" : "false");
    });
    copy.classList.remove("swap"); void copy.offsetWidth; copy.classList.add("swap");
    if (accentTar) accentTar.set(f.accent);
    fillStory(f);
  }

  // Тексты и цвета секции «история банки» под выбранный вкус
  var storyEl = document.getElementById("story");
  function fillStory(f) {
    if (!storyEl) return;
    storyEl.style.setProperty("--s-base", f.base);
    storyEl.style.setProperty("--s-base2", f.base2);
    storyEl.style.setProperty("--s-accent", f.accent);
    // Финал: небо светлее цвета банки; на светлом фоне слоган тёмный, на тёмном — белый
    var n = parseInt(f.base.slice(1), 16), rgb = [n >> 16 & 255, n >> 8 & 255, n & 255];
    var lum = (0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2]) / 255, mixW = lum > 0.5 ? 0.6 : 0.35;
    storyEl.style.setProperty("--s-sky", "rgb(" + rgb.map(function (v) { return Math.round(v + (255 - v) * mixW); }).join(",") + ")");
    storyEl.style.setProperty("--s-ink", lum > 0.45 ? "#0d1220" : "#ffffff");
    var noSugar = f.sugar === "0 g";
    document.getElementById("st0").textContent = f.name;
    document.getElementById("sp0").textContent = f.tag + ". " + f.desc;
    document.getElementById("st1").textContent = noSugar ? "Zero sugar" : f.sugar + " of sugar";
    document.getElementById("sp1").textContent = noSugar
      ? "Sweeteners instead of sugar, with the same familiar taste."
      : "Per " + f.vol + " can. Want it sugar-free? Try Zero.";
    document.getElementById("st2").textContent = f.caf + " of caffeine";
    document.getElementById("sp2").textContent = "About the same as a cup of coffee. Plus taurine and B-group vitamins.";
  }

  document.getElementById("prev").addEventListener("click", function () { goBy(-1); });
  document.getElementById("next").addEventListener("click", function () { goBy(1); });
  document.addEventListener("keydown", function (e) {
    if (e.key === "ArrowLeft") goBy(-1);
    if (e.key === "ArrowRight") goBy(1);
  });

  if (typeof THREE === "undefined") { fallback.hidden = false; sync(); return; }

  // ---------- 3D-сцена ----------
  var renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
  } catch (err) { fallback.hidden = false; sync(); return; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 3)); // чётко и на 4K-экранах
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;

  var scene = new THREE.Scene();
  var rig = new THREE.Group(); scene.add(rig); // всё, что «въезжает» при прокрутке
  var camBase = 14;
  var camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  var maxAniso = renderer.capabilities.getMaxAnisotropy();

  // Студийная среда: тёмная комната с софтбоксами. Из неё берутся блики на металле и лаке.
  function makeEnv(r) {
    var s = new THREE.Scene();
    s.add(new THREE.Mesh(new THREE.BoxGeometry(26, 26, 26), new THREE.MeshBasicMaterial({ color: 0x0b0e15, side: THREE.BackSide })));
    function panel(w, h, x, y, z, col, k) {
      var m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(col).multiplyScalar(k), side: THREE.DoubleSide }));
      m.position.set(x, y, z); m.lookAt(0, 0, 0); s.add(m);
    }
    panel(2.4, 16, -8, 0, 4, 0xffffff, 6);
    panel(1.6, 16, -5.5, 0, 8, 0xffffff, 3);
    panel(2.4, 16, 8, 0, 4, 0xaec4ff, 5);
    panel(1.2, 16, 5, 0, -8, 0xffffff, 4);
    panel(14, 2.6, 0, 9, 0, 0xffffff, 4.5);
    panel(12, 2, 0, -7, 6, 0xffd9b0, 1.8);
    panel(8, 8, 0, 1, 10, 0xffffff, 1.3);
    return new THREE.PMREMGenerator(r || renderer).fromScene(s, 0.035).texture;
  }
  var envTex = makeEnv();

  scene.add(new THREE.AmbientLight(0xffffff, 0.18));
  var key = new THREE.DirectionalLight(0xffffff, 0.8); key.position.set(-5, 6, 9); scene.add(key);
  var rim = new THREE.DirectionalLight(0xbcd0ff, 0.9); rim.position.set(6, 3, -7); scene.add(rim);
  var accentLight = new THREE.PointLight(0x7f93ff, 1.8, 32); accentLight.position.set(0, -2.6, 3); scene.add(accentLight);

  var accentCur = new THREE.Color(FLAVORS[0].accent);
  accentTar = new THREE.Color(FLAVORS[0].accent);

  // ---------- Геометрия банки: единый профиль вращения ----------
  function V(p) { return new THREE.Vector2(p[0], p[1]); }
  function spline(ctl, n) { return new THREE.SplineCurve(ctl.map(V)).getPoints(n); }

  var printed = spline([[0.45, -1.43], [0.49, -1.39], [0.525, -1.31], [0.545, -1.22], [0.55, -1.12]], 20)
    .concat(spline([[0.55, 1.0], [0.546, 1.06], [0.53, 1.13], [0.505, 1.2], [0.47, 1.255], [0.445, 1.285]], 28));
  var sCum = [0];
  for (var q = 1; q < printed.length; q++) sCum.push(sCum[q - 1] + printed[q].distanceTo(printed[q - 1]));
  var L = sCum[sCum.length - 1];
  var sB = sCum[20], sS = sCum[21]; // конец нижнего скругления, начало плеча

  var SEG = 128;
  var printedGeo = new THREE.LatheGeometry(printed, SEG);
  (function () {
    var uv = printedGeo.attributes.uv, n = printed.length;
    for (var i = 0; i <= SEG; i++) for (var j = 0; j < n; j++) uv.setY(i * n + j, sCum[j] / L);
    uv.needsUpdate = true;
  })();

  var rimPts = spline([[0.445, 1.285], [0.432, 1.305], [0.428, 1.335], [0.44, 1.355], [0.455, 1.372], [0.452, 1.39], [0.432, 1.398], [0.412, 1.39], [0.405, 1.37], [0.398, 1.345], [0.385, 1.315], [0.37, 1.29], [0.355, 1.282]], 56)
    .concat([V([0.18, 1.282]), V([0.0001, 1.282])]);
  var rimGeo = new THREE.LatheGeometry(rimPts, SEG);
  var footPts = spline([[0.45, -1.43], [0.445, -1.452], [0.425, -1.467], [0.4, -1.455], [0.385, -1.425], [0.36, -1.392], [0.31, -1.352], [0.22, -1.322], [0.1, -1.308], [0.0001, -1.305]], 44);
  var footGeo = new THREE.LatheGeometry(footPts, SEG);

  // Язычок: плоская пластина с отверстием
  function tabGeometry() {
    var w = 0.15, h = 0.27, r = 0.07, s = new THREE.Shape();
    s.moveTo(-w + r, -h); s.lineTo(w - r, -h); s.quadraticCurveTo(w, -h, w, -h + r);
    s.lineTo(w, h - r); s.quadraticCurveTo(w, h, w - r, h); s.lineTo(-w + r, h);
    s.quadraticCurveTo(-w, h, -w, h - r); s.lineTo(-w, -h + r); s.quadraticCurveTo(-w, -h, -w + r, -h);
    var hole = new THREE.Path(); hole.absellipse(0, -0.12, 0.075, 0.1, 0, Math.PI * 2, true); s.holes.push(hole);
    var g = new THREE.ExtrudeGeometry(s, { depth: 0.018, bevelEnabled: true, bevelThickness: 0.006, bevelSize: 0.006, bevelSegments: 3, curveSegments: 18 });
    g.rotateX(-Math.PI / 2);
    return g;
  }
  var tabGeo = tabGeometry();
  var scoreGeo = new THREE.RingGeometry(0.15, 0.162, 56); scoreGeo.scale(1, 1.35, 1); scoreGeo.rotateX(-Math.PI / 2);
  var rivetGeo = new THREE.CylinderGeometry(0.035, 0.04, 0.03, 20);

  // ---------- Текстуры ----------
  var TW = 2048, TH = 1664;
  var LAY = { bodyTop: (1 - sS / L) * TH, bodyBot: (1 - sB / L) * TH };

  function rngMaker(seed) { var s = seed; return function () { s = (s * 1664525 + 1013904223) % 4294967296; return s / 4294967296; }; }

  function wrapText(c, text, maxW) {
    var words = text.split(" "), lines = [], line = "";
    words.forEach(function (w) {
      var t = line ? line + " " + w : w;
      if (c.measureText(t).width > maxW && line) { lines.push(line); line = w; } else line = t;
    });
    if (line) lines.push(line);
    return lines;
  }

  function drawLabel(cv, f) {
    // У вкуса есть фото — сложную этикетку не рисуем (это сотни мс на старте), только фон до загрузки фото
    if (f.image) { var cx0 = cv.getContext("2d"); cx0.fillStyle = f.base; cx0.fillRect(0, 0, cv.width, cv.height); return; }
    var W = cv.width, H = cv.height, c = cv.getContext("2d");
    var top = LAY.bodyTop, bot = LAY.bodyBot, mid = (top + bot) / 2, bh = bot - top;
    var disp = 'Unbounded, "Arial Black", sans-serif', mono = '"IBM Plex Mono", monospace', sans = '"IBM Plex Sans", Arial, sans-serif';

    // Основа: тёмные края, яркая середина
    var g = c.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, f.base2); g.addColorStop(0.2, f.base); g.addColorStop(0.8, f.base); g.addColorStop(1, f.base2);
    c.fillStyle = g; c.fillRect(0, 0, W, H);

    // Ромбы: шахматка из «серебра» и цвета банки, как у Red Bull
    var rnd = rngMaker(7), ts = 118, span = Math.ceil(Math.hypot(W, H) / ts);
    c.save(); c.translate(W / 2, mid); c.rotate(Math.PI / 4);
    for (var iy = -span; iy < span; iy++) for (var ix = -span; ix < span; ix++) {
      if (((ix + iy) % 2 + 2) % 2) continue;
      c.globalAlpha = 0.78 + rnd() * 0.22;
      c.fillStyle = f.check; c.fillRect(ix * ts, iy * ts, ts, ts);
    }
    c.restore(); c.globalAlpha = 1;

    // Фронт: мягкая подложка под логотипом, чтобы ромбы не спорили с надписью
    var lx = W / 2, u = bh * 0.085;
    var rg = c.createRadialGradient(lx, mid, 0, lx, mid, 640);
    rg.addColorStop(0, f.base); rg.addColorStop(0.6, f.base); rg.addColorStop(1, "rgba(0,0,0,0)");
    c.save(); c.globalAlpha = 0.92; c.fillStyle = rg; c.fillRect(lx - 700, top, 1400, bh); c.restore();

    // Солнце и два быка
    var sy = mid - bh * 0.2;
    c.fillStyle = "#ffc20e"; c.beginPath(); c.arc(lx, sy - u * 0.3, u * 0.95, 0, Math.PI * 2); c.fill();
    function bull(x, y, dir) {
      c.save(); c.translate(x, y); c.scale(dir * u, u);
      c.fillStyle = "#db0a40"; c.strokeStyle = "#db0a40"; c.lineCap = "round"; c.lineJoin = "round";
      c.beginPath(); c.ellipse(-0.35, 0, 0.95, 0.42, -0.18, 0, Math.PI * 2); c.fill();          // туловище
      c.beginPath(); c.ellipse(0.62, 0.22, 0.36, 0.24, 0.55, 0, Math.PI * 2); c.fill();         // голова
      c.beginPath(); c.moveTo(0.5, 0.0); c.lineTo(0.95, -0.62); c.lineTo(0.72, 0.05); c.fill(); // рог
      c.lineWidth = 0.16;
      c.beginPath(); c.moveTo(0.15, 0.25); c.lineTo(0.75, 0.62); c.stroke();                    // передние ноги
      c.beginPath(); c.moveTo(-0.95, 0.25); c.lineTo(-1.55, 0.55); c.stroke();                  // задние ноги
      c.lineWidth = 0.08;
      c.beginPath(); c.moveTo(-1.2, -0.15); c.quadraticCurveTo(-1.55, -0.3, -1.5, -0.7); c.stroke(); // хвост
      c.restore();
    }
    bull(lx - u * 1.05, sy, 1); bull(lx + u * 1.05, sy, -1);

    // Надпись Red Bull и строка выпуска
    c.save(); c.textAlign = "center"; c.textBaseline = "middle"; c.lineJoin = "round";
    c.font = '400 250px "Titan One", "Arial Black", sans-serif'; if ("letterSpacing" in c) c.letterSpacing = "0px";
    var ww = c.measureText("Red Bull").width, ws = Math.min(1, 880 / ww);
    c.translate(lx, mid + bh * 0.02); c.scale(ws, ws);
    c.strokeStyle = "#ffffff"; c.lineWidth = 22; c.strokeText("Red Bull", 0, 0);
    c.fillStyle = "#db0a40"; c.fillText("Red Bull", 0, 0); c.restore();
    c.save(); c.textAlign = "center"; c.textBaseline = "middle"; c.fillStyle = f.text;
    c.font = "700 70px " + disp; if ("letterSpacing" in c) c.letterSpacing = "10px";
    c.fillText("ENERGY DRINK", lx, mid + bh * 0.15);
    if (f.edition) {
      c.font = "500 54px " + mono; if ("letterSpacing" in c) c.letterSpacing = "8px";
      c.fillText(f.edition, lx, mid + bh * 0.23);
      c.globalAlpha = 0.85; c.font = "400 44px " + sans; if ("letterSpacing" in c) c.letterSpacing = "4px";
      c.fillText(f.tag.toUpperCase(), lx, mid + bh * 0.29);
    }
    c.restore();

    // Плечо и дно: бренд и полосы
    c.fillStyle = f.check; c.fillRect(0, top - 6, W, 8); c.fillRect(0, bot - 2, W, 8);
    [0.125, 0.375, 0.625, 0.875].forEach(function (p) {
      c.save(); c.font = '400 74px "Titan One", "Arial Black", sans-serif';
      c.fillStyle = f.text; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText("Red Bull", W * p, top * 0.52); c.restore();
    });

    // Подложка под текст на тыльной стороне
    c.save(); c.globalAlpha = 0.85; c.fillStyle = f.base2;
    c.fillRect(0, top + 40, 340, bh - 80); c.fillRect(W - 340, top + 40, 340, bh - 80); c.restore();

    // Тыльная сторона: состав, штрихкод, возраст
    function backBlock(cx) {
      var colW = 560, x0 = cx - colW / 2;
      c.save(); c.beginPath(); c.rect(cx - 330, 0, 660, H); c.clip();
      c.textAlign = "left"; c.textBaseline = "top";
      c.fillStyle = f.accent; c.font = "500 54px " + mono; if ("letterSpacing" in c) c.letterSpacing = "8px";
      c.fillText("ENERGY DRINK", x0, top + 90);
      c.fillStyle = f.text; c.globalAlpha = 0.9; c.font = "400 31px " + sans; if ("letterSpacing" in c) c.letterSpacing = "0px";
      var t = "Carbonated energy drink. Not recommended for children, pregnant or breastfeeding women, or people sensitive to caffeine. Caffeine content: 32 mg per 100 ml. Ingredients: water, sugar, acidity regulator citric acid, taurine, caffeine, flavourings, colour, preservative potassium sorbate. Store between 0 and +25 °C. Do not mix with alcohol.";
      var y = top + 190;
      wrapText(c, t, colW).forEach(function (ln) { c.fillText(ln, x0, y); y += 44; });
      c.globalAlpha = 1;
      // штрихкод (условный)
      var bx = x0, by = bot - 330, bw = 330, bhh = 190;
      c.fillStyle = "#fff"; c.fillRect(bx, by, bw, bhh + 46);
      c.fillStyle = "#000"; var xx = bx + 18, r2 = rngMaker(11);
      while (xx < bx + bw - 18) { var w2 = 3 + Math.floor(r2() * 3) * 3; c.fillRect(xx, by + 16, w2, bhh - 16); xx += w2 + 3 + Math.floor(r2() * 3) * 3; }
      c.font = "400 28px " + mono; c.textBaseline = "alphabetic"; c.fillText("4 600123 456789", bx + 22, by + bhh + 34);
      // знак 18+
      c.strokeStyle = f.text; c.lineWidth = 6; c.beginPath(); c.arc(x0 + 480, by + 100, 62, 0, Math.PI * 2); c.stroke();
      c.fillStyle = f.text; c.font = "700 54px " + sans; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText("18+", x0 + 480, by + 104);
      c.restore();
    }
    backBlock(0); backBlock(W);

    // Металлическая крошка в краске
    for (var pass = 0; pass < 2; pass++) {
      c.fillStyle = pass ? "rgba(255,255,255,.12)" : "rgba(0,0,0,.10)";
      for (var n = 0; n < 26000; n++) c.fillRect(Math.random() * W, Math.random() * H, 1.6, 1.6);
    }
  }

  // Капли конденсата: карта нормалей
  function dropletTexture() {
    var S = 1024, cv = document.createElement("canvas"); cv.width = cv.height = S;
    var x = cv.getContext("2d"), img = x.createImageData(S, S), d = img.data, i, rnd = rngMaker(99);
    for (i = 0; i < S * S; i++) { d[i * 4] = 128; d[i * 4 + 1] = 128; d[i * 4 + 2] = 255; d[i * 4 + 3] = 255; }
    for (var n = 0; n < 1500; n++) {
      var cx = rnd() * S, cy = rnd() * S, r = 3 + Math.pow(rnd(), 2.4) * 14, ry = r * (1 + rnd() * 0.7);
      for (var py = Math.max(0, Math.floor(cy - ry)); py < Math.min(S, Math.ceil(cy + ry)); py++) {
        for (var px = Math.max(0, Math.floor(cx - r)); px < Math.min(S, Math.ceil(cx + r)); px++) {
          var nx = (px - cx) / r, ny = (py - cy) / ry, q = nx * nx + ny * ny;
          if (q >= 1) continue;
          var nxx = nx * 0.95, nyy = -ny * 0.95, nz = Math.sqrt(Math.max(0, 1 - nxx * nxx - nyy * nyy)), o = (py * S + px) * 4;
          d[o] = (nxx * 0.5 + 0.5) * 255; d[o + 1] = (nyy * 0.5 + 0.5) * 255; d[o + 2] = (nz * 0.5 + 0.5) * 255;
        }
      }
    }
    x.putImageData(img, 0, 0);
    var t = new THREE.CanvasTexture(cv);
    t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = maxAniso;
    return t;
  }
  var dropTex = dropletTexture();

  var metalMat = new THREE.MeshStandardMaterial({ color: 0xe1e5ea, metalness: 1, roughness: 0.2, envMap: envTex, envMapIntensity: 1.5, side: THREE.DoubleSide });
  var darkMat = new THREE.MeshBasicMaterial({ color: 0x4a5058, side: THREE.DoubleSide });

  var cans = [];
  FLAVORS.forEach(function (f, i) {
    var cv = document.createElement("canvas"); cv.width = TW; cv.height = TH;
    drawLabel(cv, f);
    var tex = new THREE.CanvasTexture(cv);
    tex.encoding = THREE.sRGBEncoding;
    tex.wrapS = THREE.RepeatWrapping; tex.offset.x = 0.5;
    tex.anisotropy = maxAniso;
    var mat = new THREE.MeshPhysicalMaterial({
      map: tex, metalness: 0.62, roughness: 0.3, envMap: envTex, envMapIntensity: 1.25,
      clearcoat: 1, clearcoatRoughness: 0.06, clearcoatNormalMap: dropTex, clearcoatNormalScale: new THREE.Vector2(1.1, 1.1),
      side: THREE.DoubleSide
    });
    var grp = new THREE.Group();
    grp.add(new THREE.Mesh(printedGeo, mat));
    grp.add(new THREE.Mesh(rimGeo, metalMat));
    grp.add(new THREE.Mesh(footGeo, metalMat));
    var tab = new THREE.Mesh(tabGeo, metalMat); tab.position.set(0, 1.292, 0.02); tab.rotation.y = 0.35; grp.add(tab);
    var rivet = new THREE.Mesh(rivetGeo, metalMat); rivet.position.set(0, 1.3, 0.14); grp.add(rivet);
    var score = new THREE.Mesh(scoreGeo, darkMat); score.position.set(0, 1.285, -0.12); grp.add(score);
    var holder = new THREE.Group(); holder.add(grp);
    holder.userData = { i: i, f: f, cv: cv, tex: tex, inner: grp, mat: mat };
    rig.add(holder); cans.push(holder);
    // Если у вкуса есть картинка, она заменяет нарисованную этикетку.
    // Без crop картинка — развёртка (середина = фронт). С crop это фото банки спереди:
    // вырезаем этикетку и кладём дважды по кругу, чтобы фото было и спереди, и сзади.
    if (f.image) {
      var img = new Image();
      img.onload = function () {
        var src = img;
        if (f.crop) {
          // Фото-этикетка в 4K: 4096 по окружности, сглаживание при увеличении — максимальное
          var PW = 4096, PH = Math.round(PW * TH / TW);
          var pc = document.createElement("canvas"); pc.width = PW; pc.height = PH;
          var px = pc.getContext("2d"), k = f.crop;
          px.fillStyle = f.base; px.fillRect(0, 0, PW, PH); // прозрачные края PNG не должны темнеть
          px.imageSmoothingEnabled = true; px.imageSmoothingQuality = "high";
          px.drawImage(img, k.x, k.y, k.w, k.h, PW / 4, 0, PW / 2, PH);
          px.drawImage(img, k.x, k.y, k.w, k.h, -PW / 4, 0, PW / 2, PH);
          px.drawImage(img, k.x, k.y, k.w, k.h, PW * 3 / 4, 0, PW / 2, PH);
          src = pc;
        }
        var t = new THREE.CanvasTexture(src);
        t.encoding = THREE.sRGBEncoding;
        t.wrapS = THREE.RepeatWrapping; if (!f.crop) t.offset.x = 0.5;
        t.anisotropy = maxAniso;
        // Фото уже содержит свет, блики и капли. Яркая студийная среда и тонмаппинг пересвечивали светлые банки,
        // поэтому для фото почти убираем отражения среды и показываем цвета как есть.
        mat.map = t; mat.metalness = 0; mat.roughness = 0.4; mat.envMapIntensity = 0.12; mat.clearcoat = 0.35; mat.toneMapped = false; mat.userData.k = 0.88; mat.needsUpdate = true;
      };
      img.src = f.image;
    }
  });
  function redraw() {
    cans.forEach(function (h) { if (h.userData.f.image) return; drawLabel(h.userData.cv, h.userData.f); h.userData.tex.needsUpdate = true; });
  }
  if (document.fonts && document.fonts.load) {
    Promise.all([
      document.fonts.load("700 100px Unbounded", "ENERGY DRINK"),
      document.fonts.load('400 100px "Titan One"', "Red Bull"),
      document.fonts.load('500 20px "IBM Plex Mono"', "ENERGY DRINK"),
      document.fonts.load('400 20px "IBM Plex Sans"', "Carbonated energy drink")
    ]).then(redraw).catch(function () {});
  }

  // ---------- Платформа, кольцо, свет ----------
  function ringsTexture() {
    var S = 512, c = document.createElement("canvas"); c.width = c.height = S;
    var x = c.getContext("2d"); x.fillStyle = "#1a1e26"; x.fillRect(0, 0, S, S);
    for (var r = 6; r < S / 2; r += 3) { x.strokeStyle = "rgba(255,255,255," + (0.03 + (r * 7 % 5) * 0.012) + ")"; x.lineWidth = 1.2; x.beginPath(); x.arc(S / 2, S / 2, r, 0, Math.PI * 2); x.stroke(); }
    var t = new THREE.CanvasTexture(c); t.anisotropy = maxAniso; t.encoding = THREE.sRGBEncoding; return t;
  }
  var platSide = new THREE.MeshStandardMaterial({ color: 0x12151b, metalness: 0.9, roughness: 0.22, envMap: envTex, envMapIntensity: 1.1 });
  var platTop = new THREE.MeshStandardMaterial({ map: ringsTexture(), metalness: 0.9, roughness: 0.2, envMap: envTex, envMapIntensity: 1.2 });
  var plat = new THREE.Group(); plat.position.y = -2.2; rig.add(plat);
  plat.add(new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.32, 0.26, 96), [platSide, platTop, platSide]));
  var ringMat = new THREE.MeshBasicMaterial({ color: accentCur.clone() });
  var ring = new THREE.Mesh(new THREE.TorusGeometry(1.13, 0.022, 12, 128), ringMat);
  ring.rotation.x = Math.PI / 2; ring.position.y = 0.13; plat.add(ring);
  var ringB = new THREE.Mesh(new THREE.TorusGeometry(1.31, 0.012, 10, 128), ringMat);
  ringB.rotation.x = Math.PI / 2; ringB.position.y = -0.1; plat.add(ringB);

  var halo = new THREE.Group(); halo.position.y = 2.6; rig.add(halo);
  halo.add(new THREE.Mesh(new THREE.CylinderGeometry(0.88, 0.88, 0.06, 96), [platSide, platTop, platSide]));
  var ring2 = new THREE.Mesh(new THREE.TorusGeometry(0.98, 0.026, 12, 128), ringMat);
  ring2.rotation.x = Math.PI / 2; ring2.position.y = -0.05; halo.add(ring2);

  function gradTexture(kind) {
    var c = document.createElement("canvas"), x;
    if (kind === "radial") {
      c.width = c.height = 128; x = c.getContext("2d");
      var g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
      g.addColorStop(0, "rgba(255,255,255,1)"); g.addColorStop(0.35, "rgba(255,255,255,.35)"); g.addColorStop(1, "rgba(255,255,255,0)");
      x.fillStyle = g; x.fillRect(0, 0, 128, 128);
    } else {
      c.width = 4; c.height = 128; x = c.getContext("2d");
      var v = x.createLinearGradient(0, 0, 0, 128);
      v.addColorStop(0, "#ffffff"); v.addColorStop(1, "#000000");
      x.fillStyle = v; x.fillRect(0, 0, 4, 128);
    }
    return new THREE.CanvasTexture(c);
  }
  var glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: gradTexture("radial"), color: accentCur.clone(), blending: THREE.AdditiveBlending, transparent: true, opacity: 0.55, depthWrite: false }));
  glow.scale.set(6.8, 2.3, 1); glow.position.set(0, -1.97, 0.3); rig.add(glow);

  // Контактная тень под центральной банкой
  var shadow = new THREE.Mesh(new THREE.PlaneGeometry(2.8, 2.8),
    new THREE.MeshBasicMaterial({ map: gradTexture("radial"), color: 0x000000, transparent: true, opacity: 0.6, depthWrite: false }));
  shadow.rotation.x = -Math.PI / 2; shadow.position.y = -2.06; rig.add(shadow);

  // ---------- Размер и камера ----------
  function resize() {
    var w = stage.clientWidth, h = stage.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    var half = camera.aspect < 1 ? 2.9 : 6.6;
    var dist = Math.max(13.5, half / (camera.aspect * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))));
    camBase = dist;
    camera.position.set(0, 1.0, dist);
    camera.lookAt(0, -0.2, -1.6);
    camera.updateProjectionMatrix();
  }
  if (window.ResizeObserver) new ResizeObserver(resize).observe(stage); else window.addEventListener("resize", resize);
  resize();

  // ---------- Раскладка банок по дуге ----------
  var STEP = 0.33, RAD = 10;
  function wrapPI(x) { return ((x + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI; }
  function clamp(x, a, b) { return Math.max(a, Math.min(b, x)); }
  var motion = reduce ? 0.25 : 1;

  function layout(t) {
    cans.forEach(function (h) {
      var i = h.userData.i;
      var d = (((i - cur) % N) + N) % N;
      var off = d > N / 2 ? d - N : d;
      var a = off * STEP, aoff = Math.abs(off);
      var focus = Math.exp(-off * off * 0.9);
      var vis = clamp((N / 2 + 0.05 - aoff) / 0.45, 0, 1);
      h.visible = vis > 0.02;
      h.position.set(Math.sin(a) * RAD, Math.sin(t * 1.2 + i * 1.7) * 0.08 * motion, (Math.cos(a) - 1) * RAD);
      h.rotation.z = -Math.sin(a) * 0.3;
      h.rotation.x = 0.07;
      h.scale.setScalar(vis * (0.8 + 0.2 * focus) * 1.25);
      h.userData.mat.color.setScalar((0.62 + 0.38 * focus) * (h.userData.mat.userData.k || 1));
      var spin = t * (reduce ? 0.15 : 0.55) + i * 1.3;
      var face = Math.sin(t * 0.5) * 0.3 * motion;
      var f2 = clamp((focus - 0.35) / 0.5, 0, 1);
      h.userData.inner.rotation.y = spin + f2 * wrapPI(face - spin);
    });
    var near = clamp(1 - Math.abs(cur - Math.round(cur)) * 1.6, 0, 1);
    shadow.material.opacity = 0.6 * near;
  }

  // ---------- Ввод: свайп, колесо, клик по банке ----------
  var down = null;
  var ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  stage.addEventListener("pointerdown", function (e) {
    if (e.target.closest("button")) return;
    down = { x: e.clientX, moved: false, done: false };
  });
  stage.addEventListener("pointermove", function (e) {
    if (!down) return;
    var dx = e.clientX - down.x;
    if (Math.abs(dx) > 6) down.moved = true;
    if (!down.done && Math.abs(dx) > 40) { down.done = true; goBy(dx < 0 ? 1 : -1); }
  });
  function endPointer(e) {
    if (down && !down.moved && e.type === "pointerup") pick(e);
    down = null;
  }
  stage.addEventListener("pointerup", endPointer);
  stage.addEventListener("pointercancel", endPointer);
  function pick(e) {
    var r = stage.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    var hits = ray.intersectObjects(cans.filter(function (h) { return h.visible; }), true);
    if (!hits.length) return;
    var o = hits[0].object;
    while (o && !(o.userData && o.userData.i !== undefined)) o = o.parent;
    if (o) goTo(o.userData.i);
  }
  var lastWheel = 0;
  stage.addEventListener("wheel", function (e) {
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY) && Math.abs(e.deltaX) > 20 && performance.now() - lastWheel > 350) {
      lastWheel = performance.now(); goBy(e.deltaX > 0 ? 1 : -1);
    }
  }, { passive: true });

  // ---------- История банки: отдельная сцена с одной большой банкой ----------
  // Своя WebGL-сцена: прокрутка секции задаёт шаг (0–3), банка плавно встаёт в позу шага.
  var storyFrame = null;
  // Сцену собираем чуть позже карусели, чтобы старт не был одним длинным подвисанием
  setTimeout(function () {
    var cv2 = document.getElementById("gl2");
    if (!storyEl || !cv2) return;
    var r2;
    try { r2 = new THREE.WebGLRenderer({ canvas: cv2, antialias: true, alpha: true }); } catch (err) { return; }
    r2.setPixelRatio(Math.min(window.devicePixelRatio || 1, 3));
    r2.outputEncoding = THREE.sRGBEncoding;
    r2.toneMapping = THREE.ACESFilmicToneMapping;
    r2.toneMappingExposure = 1.15;
    var env2 = makeEnv(r2);

    var sc = new THREE.Scene();
    sc.add(new THREE.AmbientLight(0xffffff, 0.2));
    var k2 = new THREE.DirectionalLight(0xffffff, 0.9); k2.position.set(-5, 6, 9); sc.add(k2);
    var rm2 = new THREE.DirectionalLight(0xbcd0ff, 1.1); rm2.position.set(6, 3, -7); sc.add(rm2);
    var cam2 = new THREE.PerspectiveCamera(30, 1, 0.1, 100);

    var labelMat = new THREE.MeshPhysicalMaterial({
      metalness: 0.62, roughness: 0.3, envMap: env2, envMapIntensity: 1.25,
      clearcoat: 1, clearcoatRoughness: 0.06, clearcoatNormalMap: dropTex, clearcoatNormalScale: new THREE.Vector2(1.1, 1.1),
      side: THREE.DoubleSide
    });
    var metal2 = metalMat.clone(); metal2.envMap = env2;
    var can = new THREE.Group();
    can.add(new THREE.Mesh(printedGeo, labelMat));
    can.add(new THREE.Mesh(rimGeo, metal2));
    can.add(new THREE.Mesh(footGeo, metal2));
    var tab = new THREE.Mesh(tabGeo, metal2); tab.position.set(0, 1.292, 0.02); tab.rotation.y = 0.35; can.add(tab);
    var rivet = new THREE.Mesh(rivetGeo, metal2); rivet.position.set(0, 1.3, 0.14); can.add(rivet);
    var score = new THREE.Mesh(scoreGeo, darkMat); score.position.set(0, 1.285, -0.12); can.add(score);
    var pivot = new THREE.Group(); pivot.add(can); sc.add(pivot);

    function size2() {
      var w = cv2.clientWidth, h = cv2.clientHeight;
      if (!w || !h) return;
      r2.setSize(w, h, false);
      cam2.aspect = w / h;
      cam2.position.set(0, 0, cam2.aspect < 0.8 ? 10.5 : 8.6);
      cam2.lookAt(0, 0, 0);
      cam2.updateProjectionMatrix();
    }
    if (window.ResizeObserver) new ResizeObserver(size2).observe(cv2); else window.addEventListener("resize", size2);
    size2();

    var visible = true;
    if (window.IntersectionObserver) new IntersectionObserver(function (en) { visible = en[0].isIntersecting; }).observe(storyEl);

    var steps = storyEl.querySelectorAll(".step"), navBtns = storyEl.querySelectorAll(".story-nav button");
    function progress() {
      var r = storyEl.getBoundingClientRect();
      return clamp(-r.top / Math.max(1, r.height - window.innerHeight), 0, 1);
    }
    Array.prototype.forEach.call(navBtns, function (b, i) {
      b.addEventListener("click", function () {
        var span = storyEl.offsetHeight - window.innerHeight;
        window.scrollTo({ top: storyEl.offsetTop + span * (i + 0.5) / 4, behavior: reduce ? "auto" : "smooth" });
      });
    });

    var pose = { x: 0, y: 0, ry: 0, rz: 0, rx: 0, s: 1 }, lastStep = -1;
    var RY = [0.15, Math.PI + 0.2, Math.PI * 1.55], RZ = [-0.38, -0.22, -0.32];
    storyFrame = function (dt, t) {
      if (!visible) return;
      var raw = progress() * 4, step = Math.min(3, Math.floor(raw)), local = raw - step;
      if (step !== lastStep) {
        lastStep = step; storyEl.setAttribute("data-step", step);
        Array.prototype.forEach.call(steps, function (el, i) { el.classList.toggle("on", i === step); });
        Array.prototype.forEach.call(navBtns, function (b, i) { b.setAttribute("aria-current", i === step ? "true" : "false"); });
      }
      var mobile = cam2.aspect < 0.8, T;
      if (step < 3) T = { x: mobile ? 0 : 1.05, y: mobile ? 0.75 : 0, ry: RY[step] + local * 0.9 * motion, rz: RZ[step], rx: 0.12, s: 1 };
      else T = { x: 0, y: -0.35, ry: Math.sin(t * 0.8) * 0.35 * motion, rz: 0, rx: 0.04, s: mobile ? 0.9 : 0.82 }; // ниже, чтобы слоган сверху был виден
      var kk = 1 - Math.exp(-dt * (reduce ? 20 : 5));
      for (var key in T) pose[key] += (T[key] - pose[key]) * kk;
      pivot.position.set(pose.x, pose.y + Math.sin(t * 1.1) * 0.05 * motion, 0);
      pivot.rotation.set(pose.rx, 0, pose.rz);
      pivot.scale.setScalar(pose.s);
      can.rotation.y = pose.ry;
      // Этикетка — та же, что у выбранной банки в карусели (включая фото, когда оно загрузится)
      var m = cans[mod(tgt)].userData.mat.map;
      if (labelMat.map !== m) { var src = cans[mod(tgt)].userData.mat; labelMat.map = m; labelMat.metalness = src.metalness; labelMat.envMapIntensity = src.envMapIntensity; labelMat.clearcoat = src.clearcoat; labelMat.roughness = src.roughness; labelMat.toneMapped = src.toneMapped; labelMat.color.setScalar(src.userData.k || 1); labelMat.needsUpdate = true; }
      r2.render(sc, cam2);
    };
  }, 300);

  // ---------- Футер: банка открывается и наливается в стакан ----------
  // Сценарий по клику (секунды): 0–0.5 язычок и пар, 0.6–1.6 наклон, 1.5–4.6 струя и уровень, 4.6–5.6 банка возвращается.
  // Реализм: напиток — прозрачный объём с поглощением цвета (transmission + attenuation), стекло — тонкая стенка
  // с отражениями студии, мягкие тени на столе, брызги, пена и пузырьки. Фон рисуется в самой сцене,
  // чтобы напиток преломлял его, а не пустоту.
  var pourFrame = null;
  // Сцену розлива собираем ещё позже — она внизу страницы
  setTimeout(function () {
    var sec = document.getElementById("pour"), cv3 = document.getElementById("gl3"), btn = document.getElementById("pourBtn");
    if (!sec || !cv3 || !btn) return;
    var r3;
    try { r3 = new THREE.WebGLRenderer({ canvas: cv3, antialias: true, alpha: false, powerPreference: "high-performance" }); } catch (err) { btn.hidden = true; return; }
    r3.setPixelRatio(Math.min(window.devicePixelRatio || 1, 3));
    r3.outputEncoding = THREE.sRGBEncoding;
    r3.toneMapping = THREE.ACESFilmicToneMapping;
    r3.toneMappingExposure = 1.05;
    r3.shadowMap.enabled = true;
    r3.shadowMap.type = THREE.PCFSoftShadowMap;
    var env3 = makeEnv(r3);
    var envGlass = (function () {
      var e = new THREE.Scene();
      e.add(new THREE.Mesh(new THREE.BoxGeometry(26, 26, 26), new THREE.MeshBasicMaterial({ color: 0x05070a, side: THREE.BackSide })));
      function strip(w, h, x, y, z, k) {
        var m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xffffff).multiplyScalar(k), side: THREE.DoubleSide }));
        m.position.set(x, y, z); m.lookAt(0, 0, 0); e.add(m);
      }
      strip(0.7, 12, -7, 1, 6, 7);    // главный узкий софтбокс слева
      strip(0.35, 7, 7, 1.5, 4, 4);   // тонкий контровой справа
      strip(9, 1.2, 0, 10, 2, 1.2);   // слабый верхний
      return new THREE.PMREMGenerator(r3).fromScene(e, 0.01).texture;
    })();
    var aniso = r3.capabilities.getMaxAnisotropy();

    var sc = new THREE.Scene();
    sc.add(new THREE.AmbientLight(0xffffff, 0.22));
    var k3 = new THREE.DirectionalLight(0xffffff, 1.05);
    k3.position.set(-4, 9, 6); k3.castShadow = true;
    k3.shadow.mapSize.set(2048, 2048); k3.shadow.radius = 6; k3.shadow.bias = -0.0004;
    var sCam = k3.shadow.camera; sCam.left = -5; sCam.right = 5; sCam.top = 5; sCam.bottom = -5; sCam.near = 1; sCam.far = 30;
    sc.add(k3); sc.add(k3.target);
    var rm3 = new THREE.DirectionalLight(0xbcd0ff, 1.1); rm3.position.set(6, 3, -7); sc.add(rm3);
    var under = new THREE.PointLight(0xffffff, 0.35, 4); sc.add(under); // подсветка напитка снизу, как на предметной съёмке
    var cam3 = new THREE.PerspectiveCamera(28, 1, 0.1, 100);
    var world = new THREE.Group(); sc.add(world);

    // Фон: градиент в цвет вкуса на плоскости позади сцены
    var bgCv = document.createElement("canvas"); bgCv.width = bgCv.height = 1024;
    var bgTex = new THREE.CanvasTexture(bgCv); bgTex.encoding = THREE.sRGBEncoding;
    var backdrop = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: bgTex, toneMapped: false }));
    sc.add(backdrop);
    function paintBackdrop(f) {
      var x = bgCv.getContext("2d"), S = 1024;
      var g = x.createLinearGradient(0, 0, 0, S); g.addColorStop(0, "#05070b"); g.addColorStop(1, f.base2);
      x.fillStyle = g; x.fillRect(0, 0, S, S);
      var r = x.createRadialGradient(S * 0.66, S * 0.55, 0, S * 0.66, S * 0.55, S * 0.55);
      r.addColorStop(0, f.base); r.addColorStop(1, "rgba(0,0,0,0)");
      x.globalAlpha = 0.55; x.fillStyle = r; x.fillRect(0, 0, S, S); x.globalAlpha = 1;
      // Мягкий светлый «софтбокс» позади стакана: напиток светится на просвет, как на предметной съёмке
      var w = x.createRadialGradient(S * 0.7, S * 0.66, 0, S * 0.7, S * 0.66, S * 0.22);
      w.addColorStop(0, "rgba(255,248,235,.55)"); w.addColorStop(1, "rgba(255,248,235,0)");
      x.fillStyle = w; x.fillRect(0, 0, S, S);
      bgTex.needsUpdate = true;
    }

    // Стол невидимый: принимает только мягкие тени, чтобы не было линии горизонта на фоне
    var table = new THREE.Mesh(new THREE.PlaneGeometry(40, 14), new THREE.ShadowMaterial({ opacity: 0.45 }));
    table.rotation.x = -Math.PI / 2; table.receiveShadow = true; world.add(table);
    var contact = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 2.2), new THREE.MeshBasicMaterial({ map: (function () {
      var c = document.createElement("canvas"); c.width = c.height = 128; var x = c.getContext("2d");
      var g = x.createRadialGradient(64, 64, 0, 64, 64, 64); g.addColorStop(0, "rgba(0,0,0,.75)"); g.addColorStop(0.45, "rgba(0,0,0,.3)"); g.addColorStop(1, "rgba(0,0,0,0)");
      x.fillStyle = g; x.fillRect(0, 0, 128, 128); return new THREE.CanvasTexture(c);
    })(), transparent: true, depthWrite: false }));
    contact.rotation.x = -Math.PI / 2; world.add(contact);
    // Каустика: свет, прошедший через напиток, ложится на стол золотым пятном со «жгутами»
    var causticTex = (function () {
      var c = document.createElement("canvas"); c.width = c.height = 256; var x = c.getContext("2d"), r = rngMaker(77);
      var g = x.createRadialGradient(128, 128, 0, 128, 128, 128); g.addColorStop(0, "rgba(255,255,255,.9)"); g.addColorStop(0.5, "rgba(255,255,255,.35)"); g.addColorStop(1, "rgba(255,255,255,0)");
      x.fillStyle = g; x.fillRect(0, 0, 256, 256);
      x.globalCompositeOperation = "lighter"; x.strokeStyle = "rgba(255,255,255,.25)";
      for (var n = 0; n < 40; n++) { x.lineWidth = 1 + r() * 3; x.beginPath(); var a = r() * 6.28, rr = 20 + r() * 80; x.arc(128 + Math.cos(a) * 10, 128 + Math.sin(a) * 10, rr, a, a + 0.6 + r()); x.stroke(); }
      return new THREE.CanvasTexture(c);
    })();
    var caustic = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.6), new THREE.MeshBasicMaterial({ map: causticTex, color: 0xf2b01e, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
    caustic.rotation.x = -Math.PI / 2; world.add(caustic);

    // Банка: язычок на шарнире и отверстие, которое появляется при открытии
    var labelMat = new THREE.MeshPhysicalMaterial({ metalness: 0.62, roughness: 0.3, envMap: env3, envMapIntensity: 1.25, clearcoat: 1, clearcoatRoughness: 0.06, side: THREE.DoubleSide });
    var metal3 = metalMat.clone(); metal3.envMap = env3;
    var can = new THREE.Group();
    can.add(new THREE.Mesh(printedGeo, labelMat));
    can.add(new THREE.Mesh(rimGeo, metal3));
    can.add(new THREE.Mesh(footGeo, metal3));
    var hinge = new THREE.Group(); hinge.position.set(0, 1.292, 0.14); can.add(hinge);
    var tab = new THREE.Mesh(tabGeo, metal3); tab.position.set(0, 0, -0.12); hinge.add(tab);
    var rivet = new THREE.Mesh(rivetGeo, metal3); rivet.position.set(0, 1.3, 0.14); can.add(rivet);
    var score = new THREE.Mesh(scoreGeo, darkMat); score.position.set(0, 1.285, -0.12); can.add(score);
    var hole = new THREE.Mesh(new THREE.CircleGeometry(0.15, 32), new THREE.MeshBasicMaterial({ color: 0x050505 }));
    hole.scale.set(1, 1.35, 1); hole.rotation.x = -Math.PI / 2; hole.position.set(0, 1.288, -0.12); hole.visible = false; can.add(hole);
    can.traverse(function (o) { if (o.isMesh) o.castShadow = true; });
    var pivot = new THREE.Group(); pivot.add(can); world.add(pivot);

    // Стакан: стенка со скруглённым краем и толстым дном.
    // Два слоя: еле заметный прозрачный корпус и аддитивный слой, который добавляет только отражения.
    var GH = 1.95, BASE = 0.16, LMAX = 1.45;
    var glassGeo = new THREE.LatheGeometry([
      [0.001, 0], [0.5, 0], [0.54, 0.025], [0.56, 0.1], [0.69, GH], [0.692, GH + 0.006], [0.684, GH + 0.012], [0.674, GH + 0.006],
      [0.664, GH - 0.02], [0.545, BASE + 0.03], [0.515, BASE], [0.001, BASE]
    ].map(V), 128);
    var glassBody = new THREE.Mesh(glassGeo, new THREE.MeshPhysicalMaterial({ color: 0xdfe8f2, metalness: 0, roughness: 0.05, transparent: true, opacity: 0.04, side: THREE.DoubleSide, depthWrite: false }));
    var glassRefl = new THREE.Mesh(glassGeo, new THREE.MeshPhysicalMaterial({
      color: 0x000000, metalness: 0, roughness: 0.1, envMap: env3, envMapIntensity: 0.2, clearcoat: 1, clearcoatRoughness: 0.12,
      transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide
    }));
    glassBody.renderOrder = 4; glassRefl.renderOrder = 5;
    glassRefl.material.envMap = envGlass; glassRefl.material.envMapIntensity = 0.9;
    glassRefl.material.clearcoatNormalMap = dropTex; glassRefl.material.clearcoatNormalScale = new THREE.Vector2(0.5, 0.5);
    // Контур: у настоящего стекла края видны сильнее, чем середина (эффект Френеля)
    var edgeMat = new THREE.ShaderMaterial({
      uniforms: { uColor: { value: new THREE.Color(0xe6eef8) } },
      vertexShader: "varying vec3 vN; varying vec3 vV; void main(){ vec4 mv = modelViewMatrix * vec4(position,1.0); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }",
      fragmentShader: "uniform vec3 uColor; varying vec3 vN; varying vec3 vV; void main(){ float f = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), 2.6); gl_FragColor = vec4(uColor, f * 0.6); }",
      transparent: true, depthWrite: false, side: THREE.DoubleSide
    });
    var glassEdge = new THREE.Mesh(glassGeo, edgeMat); glassEdge.renderOrder = 6;
    // Запотевание: холодный напиток туманит стенку ниже уровня, проступают капли
    var frostMat = new THREE.ShaderMaterial({
      uniforms: { uFog: { value: 0 }, uLevel: { value: 0 }, uDrops: { value: dropTex } },
      vertexShader: "varying float vY; varying vec2 vUv; void main(){ vY = position.y; vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }",
      fragmentShader: "uniform float uFog; uniform float uLevel; uniform sampler2D uDrops; varying float vY; varying vec2 vUv; void main(){ float below = smoothstep(uLevel + 0.06, uLevel - 0.04, vY); vec2 d = texture2D(uDrops, vUv * vec2(3.0, 2.0)).rg - 0.5; float drop = clamp(length(d) * 4.0, 0.0, 1.0); float col = fract(sin(floor(vUv.x * 70.0) * 12.9898) * 43758.5453); float lane = 1.0 - smoothstep(0.0, 0.18, abs(fract(vUv.x * 70.0) - 0.5)); float trail = step(0.82, col) * lane * step(vY, uLevel) * step(uLevel - uFog * 1.4 * col, vY); float a = uFog * below * (0.16 + drop * 0.45) * (1.0 - trail * 0.8) + trail * uFog * 0.25; gl_FragColor = vec4(vec3(0.93, 0.96, 1.0), a); }",
      transparent: true, depthWrite: false
    });
    var frost = new THREE.Mesh(glassGeo, frostMat); frost.scale.set(1.004, 1, 1.004); frost.renderOrder = 7;
    var glassG = new THREE.Group(); glassG.add(glassBody); glassG.add(glassRefl); glassG.add(glassEdge); glassG.add(frost); world.add(glassG);

    // Напиток: прозрачный объём, цвет набирается с глубиной, как у настоящей жидкости
    // Рябь: карта нормалей из нескольких синусоид, двигается по поверхности
    var rippleTex = (function () {
      var S = 256, c = document.createElement("canvas"); c.width = c.height = S;
      var x = c.getContext("2d"), img = x.createImageData(S, S), d = img.data;
      function H(i, j) { var u = i / S * 6.2832, v = j / S * 6.2832; return Math.sin(u * 3 + Math.sin(v * 2) * 1.5) * 0.5 + Math.sin(v * 5 + u * 2) * 0.3 + Math.sin((u + v) * 7) * 0.15; }
      for (var j = 0; j < S; j++) for (var i = 0; i < S; i++) {
        var dx = (H(i + 1, j) - H(i - 1, j)) * 2.5, dy = (H(i, j + 1) - H(i, j - 1)) * 2.5, l = Math.sqrt(dx * dx + dy * dy + 1), o = (j * S + i) * 4;
        d[o] = (-dx / l * 0.5 + 0.5) * 255; d[o + 1] = (-dy / l * 0.5 + 0.5) * 255; d[o + 2] = (1 / l * 0.5 + 0.5) * 255; d[o + 3] = 255;
      }
      x.putImageData(img, 0, 0);
      var t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(2, 2); return t;
    })();
    var liqMat = new THREE.MeshPhysicalMaterial({
      color: 0xf2b01e, metalness: 0, roughness: 0.02, transmission: 1, thickness: 1.2, ior: 1.34,
      attenuationColor: new THREE.Color(0xf2b01e), attenuationDistance: 0.35, envMap: env3, envMapIntensity: 0.22, specularIntensity: 0.6, // яркая студия в отражениях выбеливала напиток
      emissive: 0xf2b01e, emissiveIntensity: 0.42, // свет, проходящий сквозь напиток: тёмно-синий фон иначе делает его оливковым
      vertexColors: true,                         // ко дну слой толще — напиток темнее и насыщеннее
      toneMapped: false,                          // тонмаппинг гасил насыщенность светлых напитков
      clearcoat: 0.35, clearcoatRoughness: 0.02, clearcoatNormalMap: rippleTex, clearcoatNormalScale: new THREE.Vector2(0.1, 0.1)
    });
    var liquid = new THREE.Mesh(new THREE.BufferGeometry(), liqMat); liquid.position.y = BASE; liquid.castShadow = true; glassG.add(liquid);
    var streamMat = liqMat.clone(); streamMat.thickness = 0.1; streamMat.attenuationDistance = 0.5; streamMat.emissiveIntensity = 0.4;
    streamMat.vertexColors = false; streamMat.clearcoatNormalMap = null;

    // Пена: шершавый кремовый слой, толще во время налива и оседает после
    var foamTex = (function () {
      var c = document.createElement("canvas"); c.width = c.height = 256; var x = c.getContext("2d"), r = rngMaker(21);
      x.fillStyle = "#808080"; x.fillRect(0, 0, 256, 256);
      for (var n = 0; n < 900; n++) { var rr = 1 + r() * 5; x.fillStyle = "rgba(255,255,255," + (0.2 + r() * 0.5) + ")"; x.beginPath(); x.arc(r() * 256, r() * 256, rr, 0, 7); x.fill(); }
      var t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(2, 2); return t;
    })();
    var foam = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 1, 96, 1), new THREE.MeshStandardMaterial({ color: 0xfff6e2, roughness: 0.9, bumpMap: foamTex, bumpScale: 0.02, transparent: true, opacity: 0.55, depthWrite: false }));
    glassG.add(foam);
    var NC = 160;
    var ch = [], rc = rngMaker(91);
    for (var ci = 0; ci < NC; ci++) ch.push({ o: rc(), a: rc() * Math.PI * 2, r: rc(), s: 0.005 + rc() * 0.01 });
    var meniscus = new THREE.Mesh(new THREE.TorusGeometry(1, 0.006, 6, 96), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.4, blending: THREE.AdditiveBlending, depthWrite: false }));
    meniscus.rotation.x = Math.PI / 2;
    var NF = 520, fh = [], rf = rngMaker(33);
    for (var fi = 0; fi < NF; fi++) { var edge = rf() < 0.4; fh.push({ a: rf() * Math.PI * 2, r: edge ? 0.9 + rf() * 0.1 : Math.sqrt(rf()) * 0.92, s: 0.012 + Math.pow(rf(), 2.2) * 0.05, y: rf(), edge: edge, f: 2 + rf() * 6, ph: rf() * 6.28 }); }
    glassG.add(meniscus);
    var ripples = [];
    for (var ri = 0; ri < 5; ri++) {
      var rg = new THREE.Mesh(new THREE.RingGeometry(0.92, 1, 64), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false }));
      rg.rotation.x = -Math.PI / 2; rg.userData.k = ri / 5; glassG.add(rg); ripples.push(rg);
    }

    // Пузырьки, брызги и пар — инстансы и точки, чтобы их было много и это не тормозило
    var dummy = new THREE.Object3D();
    var bubTex = (function () {
      var S = 64, c = document.createElement("canvas"); c.width = c.height = S; var x = c.getContext("2d");
      var g = x.createRadialGradient(32, 32, 0, 32, 32, 31);
      g.addColorStop(0, "rgba(255,255,255,0.06)"); g.addColorStop(0.62, "rgba(255,255,255,0.12)");
      g.addColorStop(0.8, "rgba(255,255,255,0.95)"); g.addColorStop(0.92, "rgba(255,255,255,0.5)"); g.addColorStop(1, "rgba(255,255,255,0)");
      x.fillStyle = g; x.fillRect(0, 0, S, S);
      var hl = x.createRadialGradient(22, 21, 0, 22, 21, 8); hl.addColorStop(0, "rgba(255,255,255,1)"); hl.addColorStop(1, "rgba(255,255,255,0)");
      x.fillStyle = hl; x.fillRect(0, 0, S, S);
      return new THREE.CanvasTexture(c);
    })();
    var ptMats = [];
    function bubblePoints(n, tint) {
      var g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(n * 3), 3));
      g.setAttribute("aSize", new THREE.BufferAttribute(new Float32Array(n), 1));
      var m = new THREE.ShaderMaterial({
        uniforms: { uMap: { value: bubTex }, uScale: { value: 600 }, uTint: { value: new THREE.Color(tint) } },
        vertexShader: "attribute float aSize; uniform float uScale; void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_PointSize = aSize * uScale / -mv.z; gl_Position = projectionMatrix * mv; }",
        fragmentShader: "uniform sampler2D uMap; uniform vec3 uTint; void main(){ vec4 c = texture2D(uMap, gl_PointCoord); gl_FragColor = vec4(uTint * c.rgb, c.a); }",
        transparent: true, depthWrite: false, depthTest: false
      });
      ptMats.push(m);
      var pp = new THREE.Points(g, m); pp.renderOrder = 8; pp.frustumCulled = false; return pp;
    }
    function setPt(P, i, x, y, z, size) {
      var a = P.geometry.attributes.position.array; a[i * 3] = x; a[i * 3 + 1] = y; a[i * 3 + 2] = z;
      P.geometry.attributes.aSize.array[i] = size;
    }
    function flushPts(P) { P.geometry.attributes.position.needsUpdate = true; P.geometry.attributes.aSize.needsUpdate = true; }
    var NB = 220;
    var bub = [], rb = rngMaker(5);
    for (var bi = 0; bi < NB; bi++) {
      if (bi < 40) { // 5 «ниточек» пузырьков из одних и тех же точек на дне, как в газировке
        var cc = bi % 5; bub.push({ a: cc * 1.256 + 0.3, r: 0.3 + 0.12 * (cc % 3), y: bi / 40, s: 1.3 + (cc % 2) * 0.3, z: 0.006 + (cc % 3) * 0.002, wall: false }); continue;
      }
      var wall = rb() < 0.3; // часть пузырьков прилипла к стенкам
      bub.push({ a: rb() * Math.PI * 2, r: wall ? 0.97 : Math.sqrt(rb()) * 0.9, y: rb(), s: wall ? 0.02 : 0.25 + rb() * 0.8, z: 0.004 + Math.pow(rb(), 2.5) * 0.014, wall: wall });
    }
    var bubPts = bubblePoints(NB, 0xfff6e0), churnPts = bubblePoints(NC, 0xffffff), foamPts = bubblePoints(NF, 0xfffaf0);
    glassG.add(bubPts); glassG.add(churnPts); glassG.add(foamPts);
    var ND = 48, drops = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 10, 8), streamMat, ND), dr = [];
    for (var di = 0; di < ND; di++) dr.push({ on: false, p: new THREE.Vector3(), v: new THREE.Vector3(), life: 0, s: 0 });
    world.add(drops);
    var mistTex = gradTexture("radial"), mist = [];
    for (var mi = 0; mi < 14; mi++) {
      var sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: mistTex, color: 0xffffff, transparent: true, opacity: 0, depthWrite: false }));
      sp.userData = { d: new THREE.Vector3((rb() - 0.5) * 0.4, 0.5 + rb() * 0.6, (rb() - 0.5) * 0.3), delay: rb() * 0.35 };
      world.add(sp); mist.push(sp);
    }
    var stream = new THREE.Mesh(new THREE.BufferGeometry(), streamMat); stream.visible = false; world.add(stream);

    var shownLevel = -1, foamH = 0;
    function setLevel(level) {
      if (Math.abs(level - shownLevel) < 0.002) return;
      shownLevel = level;
      var h = Math.max(0.001, level * LMAX), rTop = 0.515 + 0.0855 * h;
      liquid.geometry.dispose();
      function R(y) { return 0.506 + 0.0855 * y; }
      var prof = [[0.001, 0], [R(0), 0]], mn = Math.min(0.012, h * 0.3);
      for (var k = 1; k <= 8; k++) { var yy = (h - mn) * k / 8; prof.push([R(yy), yy]); }
      var rh = R(h);
      prof.push([rh, h + mn * 0.9], [rh - 0.014, h + mn * 0.25], [rh - 0.045, h], [0.001, h]);
      var lg = new THREE.LatheGeometry(prof.map(V), 128);
      var pos = lg.attributes.position, cols = new Float32Array(pos.count * 3);
      for (var vi = 0; vi < pos.count; vi++) { var f = 0.62 + 0.38 * Math.min(1, pos.getY(vi) / Math.max(h, 0.001)); cols[vi * 3] = cols[vi * 3 + 1] = cols[vi * 3 + 2] = f; }
      lg.setAttribute("color", new THREE.BufferAttribute(cols, 3));
      liquid.geometry = lg;
      liquid.visible = level > 0.01;
    }

    var mobile = false, idle = { x: 0.55, y: 1.0 }, camDist = 12, zoomS = 0;
    function size3() {
      var w = cv3.clientWidth, hh = cv3.clientHeight;
      if (!w || !hh) return;
      r3.setSize(w, hh, false);
      var ptScale = hh * r3.getPixelRatio() / (2 * Math.tan(THREE.MathUtils.degToRad(cam3.fov / 2)));
      ptMats.forEach(function (m) { m.uniforms.uScale.value = ptScale; });
      cam3.aspect = w / hh;
      mobile = cam3.aspect < 0.8;
      // Дистанция подбирается так, чтобы банка и стакан целиком помещались при любом соотношении сторон
      var tf = Math.tan(THREE.MathUtils.degToRad(cam3.fov / 2)), hw = mobile ? 1.9 : 3.3, hh2 = mobile ? 3.7 : 3.1;
      var dist = Math.max(hh2 / tf, hw / (cam3.aspect * tf));
      camDist = dist;
      cam3.position.set(0, 0.35, dist);
      cam3.lookAt(0, 0, 0);
      cam3.updateProjectionMatrix();
      glassG.position.set(mobile ? 0.95 : 1.75, mobile ? -1.85 : -2.25, 0);
      idle = mobile ? { x: 0, y: 1.9 } : { x: 0.55, y: 1.0 };
      table.position.set(0, glassG.position.y - 0.001, -3);
      contact.position.set(glassG.position.x, glassG.position.y + 0.002, 0);
      caustic.position.set(glassG.position.x + 0.85, glassG.position.y + 0.004, -0.35);
      k3.target.position.set(glassG.position.x, glassG.position.y, 0);
      under.position.set(glassG.position.x, glassG.position.y + 0.25, 1.2);
      // Фон закрывает весь кадр на своей глубине
      var bz = -9, bd = dist - bz, bh = 2 * bd * tf * 1.45;
      backdrop.position.set(0, 0.35, bz); backdrop.scale.set(bh * cam3.aspect, bh, 1);
    }
    if (window.ResizeObserver) new ResizeObserver(size3).observe(cv3); else window.addEventListener("resize", size3);
    size3();

    var visible = true;
    if (window.IntersectionObserver) new IntersectionObserver(function (en) { visible = en[0].isIntersecting; }).observe(sec);

    var phase = "idle", T = 0, sel = -1, fog = 0, prevT = 0;
    var sfx = makePourSound(document.getElementById("soundBtn"));
    function ease(x) { x = clamp(x, 0, 1); return x * x * (3 - 2 * x); }
    function reset() {
      phase = "idle"; T = 0; foamH = 0; fog = 0; setLevel(0);
      dr.forEach(function (d) { d.on = false; });
      btn.disabled = false; btn.textContent = "Open the can";
    }
    btn.addEventListener("click", function () {
      if (phase === "pour") return;
      setLevel(0); foamH = 0;
      if (reduce) { phase = "done"; T = 99; setLevel(1); foamH = 0.05; btn.textContent = "Pour again"; return; }
      phase = "pour"; T = 0; btn.disabled = true; btn.textContent = "Pouring…";
      if (sfx) sfx.play();
    });
    reset();

    var off = new THREE.Vector3(), mouthLocal = new THREE.Vector3(0, 1.29, -0.12), tmpE = new THREE.Euler();
    var pts = []; for (var pi = 0; pi < 14; pi++) pts.push(new THREE.Vector3());
    var curve = new THREE.CatmullRomCurve3(pts);
    pourFrame = function (dt, t) {
      // Выбранный вкус: этикетка, цвет напитка и фона
      var i = mod(tgt), src = cans[i].userData.mat;
      if (i !== sel) {
        sel = i; var f = FLAVORS[i];
        [liqMat, streamMat].forEach(function (m) { m.color.set(f.liquid || "#f2b01e"); m.attenuationColor.set(f.liquid || "#f2b01e"); m.emissive.set(f.liquid || "#f2b01e"); });
        under.color.set(f.liquid || "#f2b01e");
        paintBackdrop(f);
        sec.style.setProperty("--p-base", f.base); sec.style.setProperty("--p-base2", f.base2); sec.style.setProperty("--p-accent", f.accent);
        document.getElementById("pTag").textContent = f.name;
        if (phase !== "pour") reset();
      }
      if (labelMat.map !== src.map) {
        labelMat.map = src.map; labelMat.metalness = src.metalness; labelMat.roughness = src.roughness;
        labelMat.envMapIntensity = src.envMapIntensity; labelMat.clearcoat = src.clearcoat; labelMat.toneMapped = src.toneMapped;
        labelMat.color.setScalar(src.userData.k || 1); labelMat.needsUpdate = true;
      }
      if (!visible) return;

      if (phase !== "idle") T += dt; // в «done» время идёт дальше: шипение и запотевание затихают плавно
      if (phase === "pour" && T > 5.7) { phase = "done"; btn.disabled = false; btn.textContent = "Pour again"; }
      var opened = phase === "idle" ? 0 : ease(T / 0.45);
      var blend = phase === "pour" ? ease((T - 0.6) / 1.0) - ease((T - 4.6) / 1.0) : 0;
      var level = phase === "idle" ? 0 : clamp((T - 1.55) / 3.05, 0, 1);
      level = 1 - Math.pow(1 - level, 1.4); // сначала льётся быстрее, к концу медленнее
      hinge.rotation.x = 1.1 * opened;
      hole.visible = opened > 0.4;

      // Поза: в покое банка наклонена и покачивается, при розливе горлышко встаёт над краем стакана
      var rz = (-0.32 + Math.sin(t * 0.8) * 0.05 * motion) * (1 - blend) + (-1.8 - 0.7 * level) * blend; // чем меньше в банке, тем сильнее её наклоняют
      var ry = (0.15 + Math.sin(t * 0.5) * 0.3 * motion) * (1 - blend) + (-Math.PI / 2) * blend;
      pivot.rotation.set(0.05 * (1 - blend), 0, rz);
      can.rotation.y = ry;
      off.copy(mouthLocal).applyEuler(can.rotation).applyEuler(tmpE.copy(pivot.rotation));
      var gx = glassG.position.x, gy = glassG.position.y;
      var px = gx - 0.32 - off.x, py = gy + GH + 0.75 - off.y;
      pivot.position.set(
        idle.x * (1 - blend) + px * blend,
        (idle.y + Math.sin(t * 1.1) * 0.06 * motion) * (1 - blend) + py * blend,
        0
      );
      var mx = pivot.position.x + off.x, my = pivot.position.y + off.y, mz = pivot.position.z + off.z;

      // Пар из отверстия в момент открытия
      mist.forEach(function (sp) {
        var u = sp.userData, k = phase === "pour" ? (T - 0.25 - u.delay) / 0.9 : -1;
        if (k <= 0 || k >= 1) { sp.material.opacity = 0; return; }
        sp.position.set(mx + u.d.x * k, my + u.d.y * k, mz + u.d.z * k);
        sp.scale.setScalar(0.12 + k * 0.45);
        sp.material.opacity = 0.32 * Math.sin(k * Math.PI);
      });

      // Уровень и пена
      setLevel(level);
      var h = level * LMAX, surf = BASE + h, rTop = 0.515 + 0.0855 * h;
      var pouring = phase === "pour" && T > 1.55 && T < 4.6;
      var foamTarget = level <= 0.01 ? 0 : pouring ? 0.09 + 0.06 * Math.sin(T * 3) * 0.3 : 0.04;
      foamH += (foamTarget - foamH) * (1 - Math.exp(-dt * (pouring ? 6 : 0.9)));
      foam.visible = level > 0.01 && foamH > 0.004;
      foam.scale.set(rTop - 0.008 + foamH * 0.06, foamH, rTop - 0.008 + foamH * 0.06);
      foam.position.y = surf + foamH * 0.35;
      foam.rotation.y = t * 0.05;
      // После налива поверхность ещё немного качается и успокаивается
      var since = T - 4.6, slosh = phase !== "idle" && since > 0 ? 0.035 * Math.exp(-since * 1.4) * Math.sin(since * 8.5) * motion : 0;
      foam.rotation.z = slosh; foam.rotation.x = slosh * 0.6;
      meniscus.visible = level > 0.01;
      meniscus.scale.setScalar(rTop - 0.004); meniscus.position.y = surf + 0.002; meniscus.rotation.y = slosh;

      // Струя: дуга от горлышка в стакан, с дрожью; в конце отрывается и падает
      var on = phase === "pour" && T > 1.5 && T < 5.05;
      var landX = gx - 0.02, landY = gy + surf + foamH * 0.5;
      if (on) {
        var drop = T < 4.6 ? 0 : (T - 4.6) * 9, reach = Math.min(1, (T - 1.5) * 2.6);
        var topY = my - drop;
        if (topY - landY < 0.05) on = false;
        else {
          for (var k = 0; k < pts.length; k++) {
            var u = k / (pts.length - 1) * reach;
            var wob = Math.sin(t * 34 + u * 14) * 0.012 * u * motion;
            pts[k].set(mx + (landX - mx) * Math.sqrt(u) + wob, topY - (topY - landY) * u * u, mz * (1 - u) + wob * 0.6);
          }
          curve.updateArcLengths();
          stream.geometry.dispose();
          stream.geometry = new THREE.TubeGeometry(curve, 56, 0.04, 12, false);
          // Настоящая струя толще у горлышка и тоньше внизу: сжимаем кольца трубки к оси
          var pa = stream.geometry.attributes.position, cpt = new THREE.Vector3();
          for (var ring = 0; ring <= 56; ring++) {
            var uu = ring / 56; curve.getPointAt(uu, cpt);
            var glug = 1 + 0.28 * Math.pow(Math.max(0, Math.sin(T * 22 - uu * 9)), 6) * motion; // воздух входит в банку — струя идёт толчками
            var tap = (1.25 - 0.55 * uu) * (1 + Math.sin(t * 26 + uu * 18) * 0.08 * motion) * glug * (1 - 0.35 * level);
            for (var rv = 0; rv <= 12; rv++) {
              var vi = ring * 13 + rv;
              pa.setXYZ(vi, cpt.x + (pa.getX(vi) - cpt.x) * tap, cpt.y + (pa.getY(vi) - cpt.y) * tap, cpt.z + (pa.getZ(vi) - cpt.z) * tap);
            }
          }
          pa.needsUpdate = true; stream.geometry.computeVertexNormals();
        }
      }
      stream.visible = on;

      // Брызги от удара струи о поверхность
      var g = -7.5;
      [4.75, 5.0, 5.35].forEach(function (dt0) {
        if (phase === "pour" && prevT < dt0 && T >= dt0) {
          for (var q = 0; q < ND; q++) if (!dr[q].on) { var dd = dr[q]; dd.on = true; dd.life = 0; dd.s = 0.032; dd.p.set(mx, my - 0.03, mz); dd.v.set(0, -0.4, 0); break; }
        }
      });
      prevT = T;
      dr.forEach(function (d) {
        if (!d.on && on && T < 4.6 && Math.random() < dt * 60) {
          d.on = true; d.life = 0; d.s = 0.007 + Math.random() * 0.011;
          d.p.set(landX + (Math.random() - 0.5) * 0.1, landY, (Math.random() - 0.5) * 0.1);
          var a = Math.random() * Math.PI * 2, sp2 = 0.4 + Math.random() * 0.9;
          d.v.set(Math.cos(a) * sp2 * 0.6, 1.2 + Math.random() * 1.6, Math.sin(a) * sp2 * 0.6);
        }
        if (d.on) {
          d.life += dt; d.v.y += g * dt; d.p.addScaledVector(d.v, dt);
          if (d.p.y < landY - 0.02 || d.life > 1.2) d.on = false;
        }
      });
      for (var j = 0; j < ND; j++) {
        var d = dr[j];
        dummy.position.copy(d.p); dummy.scale.setScalar(d.on ? d.s : 0.00001); dummy.updateMatrix();
        drops.setMatrixAt(j, dummy.matrix);
      }
      drops.instanceMatrix.needsUpdate = true;

      // Пузырьки: поднимаются быстрее во время налива; часть сидит на стенках
      var boost = pouring ? 2.2 : 1;
      for (var bi2 = 0; bi2 < NB; bi2++) {
        var b = bub[bi2];
        b.y += dt * b.s * 0.32 * boost * motion; if (b.y > 1) b.y -= 1;
        var yy = BASE + 0.02 + b.y * Math.max(0, h - 0.04), rr = b.r * (0.505 + 0.0855 * (yy - BASE));
        // пузырёк растёт по мере подъёма (давление падает), у поверхности исчезает
        var near = clamp((1 - b.y) * 8, 0, 1);
        setPt(bubPts, bi2, Math.cos(b.a) * rr, yy, Math.sin(b.a) * rr, level > 0.04 ? 2 * b.z * (b.wall ? 1 : 0.6 + b.y * 0.8) * (b.wall ? 1 : near) : 0);
      }
      flushPts(bubPts);

      // Пена из пузырьков: шапка во время налива, к стенкам липнет кольцо
      var fk = clamp(foamH / 0.09, 0, 1);
      for (var q2 = 0; q2 < NF; q2++) {
        var fb = fh[q2], rr2 = fb.r * (rTop - 0.02);
        var pop = 0.55 + 0.45 * Math.sin(t * fb.f + fb.ph); // пузырьки пены лопаются и появляются снова
        setPt(foamPts, q2, Math.cos(fb.a) * rr2, surf + foamH * (0.15 + fb.y * 0.9) + (fb.edge ? 0.012 : 0), Math.sin(fb.a) * rr2,
          level > 0.02 ? fb.s * pop * (fb.edge ? Math.max(0.6, fk) : fk) : 0);
      }
      flushPts(foamPts);

      // Вихрь мелких пузырей, который струя загоняет под поверхность
      for (var c2 = 0; c2 < NC; c2++) {
        var cb = ch[c2], kk = (t * 1.3 + cb.o) % 1, dep = kk * Math.min(h * 0.9, 0.9), spread = 0.05 + dep * 0.55 * cb.r;
        setPt(churnPts, c2, landX - gx + Math.cos(cb.a + t) * spread, surf - 0.02 - dep, Math.sin(cb.a + t) * spread,
          pouring && level > 0.05 ? 2 * cb.s * (1 - kk * 0.6) : 0);
      }
      flushPts(churnPts);

      // Рябь бежит по поверхности; во время налива сильнее
      rippleTex.offset.set(t * 0.035, t * 0.02);
      liqMat.clearcoatNormalScale.setScalar(pouring ? 0.4 : 0.08 + Math.abs(slosh) * 3);

      // Круги на поверхности от струи
      ripples.forEach(function (rg) {
        var k = (t * 1.6 + rg.userData.k) % 1;
        rg.visible = pouring && level > 0.03;
        rg.position.set(landX - gx, surf + foamH + 0.004, 0);
        rg.scale.setScalar(0.05 + k * (rTop - 0.08));
        rg.material.opacity = 0.35 * (1 - k);
      });

      // Каустика и запотевание растут с уровнем и временем
      under.intensity = 0.35 * level; // подсветка снизу только когда есть напиток, иначе на пустом дне горит блик
      caustic.material.color.copy(liqMat.attenuationColor);
      caustic.material.opacity = level * (0.55 + (pouring ? Math.sin(t * 9) * 0.08 : 0));
      if (phase !== "idle") fog = Math.min(0.35, fog + dt / 14); // лёгкое запотевание, чтобы не глушить цвет напитка
      frostMat.uniforms.uFog.value = fog;
      frostMat.uniforms.uLevel.value = surf;

      // Камера: мягкий наезд на стакан во время налива
      zoomS += ((phase === "pour" && T > 1.0 && T < 5.0 ? 1 : 0) - zoomS) * (1 - Math.exp(-dt * 1.6));
      var zs = zoomS * motion;
      cam3.position.set(gx * 0.28 * zs, 0.35 + (gy + 1.2) * 0.25 * zs, camDist * (1 - 0.2 * zs));
      cam3.lookAt(gx * 0.45 * zs, (gy + 1.0) * 0.4 * zs, 0);
      if (sfx) sfx.update(phase === "idle" ? -1 : T, level);

      r3.render(sc, cam3);
    };
  }, 700);

  // Главную сцену не рисуем, пока карусель за экраном
  var stageVis = true;
  if (window.IntersectionObserver) new IntersectionObserver(function (en) { stageVis = en[0].isIntersecting; }).observe(stage);

  // ---------- Цикл ----------
  var t = 0, last = performance.now(), frameN = 0;
  function frame(now) {
    var dt = Math.min(0.05, (now - last) / 1000); last = now; t += dt;
    cur += (tgt - cur) * (1 - Math.exp(-dt * (reduce ? 12 : 4.2)));
    accentCur.lerp(accentTar, 1 - Math.exp(-dt * 4));
    ringMat.color.copy(accentCur); glow.material.color.copy(accentCur); accentLight.color.copy(accentCur);
    if ((frameN++ & 3) === 0) {
      stage.style.setProperty("--glow", "rgba(" + Math.round(accentCur.r * 255) + "," + Math.round(accentCur.g * 255) + "," + Math.round(accentCur.b * 255) + ",.28)");
    }
    halo.position.y = 2.6 + Math.sin(t * 0.9) * 0.05 * motion;
    var q = window.__stageIn === undefined ? 1 : window.__stageIn, e = 1 - Math.pow(1 - q, 3);
    rig.position.y = -(1 - e) * 5.5; rig.scale.setScalar(0.8 + 0.2 * e); rig.rotation.x = (1 - e) * 0.25;
    camera.position.z = camBase * (1 + (1 - e) * 0.3);
    glow.material.opacity = 0.55 * e;
    layout(t);
    if (q > 0.002 && stageVis) renderer.render(scene, camera);
    if (storyFrame) storyFrame(dt, t);
    if (pourFrame) pourFrame(dt, t);
    requestAnimationFrame(frame);
  }
  window.__ready = true;
  sync();
  requestAnimationFrame(frame);
}
