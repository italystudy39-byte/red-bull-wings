// Быки на заставке.
// 1) Из логотипа (JPG 900×900) строим чистые слои: две маски — «краска» (жёлтый контур + красное тело) и «красный»,
//    увеличиваем их в 3 раза со сглаживанием и заново заливаем фирменными цветами. Края получаются ровными,
//    без белой каймы и «лесенки», как у векторного логотипа.
// 2) Галоп: каждый шаг тело взлетает и вытягивается, на приземлении сжимается и клюёт носом,
//    из-под копыт летит пыль, на скорости — горизонтальный смаз. Быки замедляются и встречаются лбами у солнца.
var Bulls = (function () {
  var box = document.getElementById("bulls");
  if (!box) return null;

  // Кадр с быками на исходной картинке и круг солнца (в пикселях картинки)
  var B = { src: "img/bulls-logo.jpg", x: 136, y: 218, w: 640, h: 248, cx: 458, cy: 348, r: 127 };
  var S = 3, RED = [219, 0, 66], YEL = [253, 211, 1];
  var wl = box.querySelector(".bl"), wr = box.querySelector(".br");

  function clamp(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function edge(a) { var t = clamp((a - 0.34) / 0.32); return t * t * (3 - 2 * t); } // резкий, но сглаженный край

  var img = new Image();
  img.onload = function () {
    var c = document.createElement("canvas"); c.width = B.w; c.height = B.h;
    var x = c.getContext("2d"), id;
    x.drawImage(img, B.x, B.y, B.w, B.h, 0, 0, B.w, B.h);
    try { id = x.getImageData(0, 0, B.w, B.h); } catch (e) { box.hidden = true; return; } // file:// не даёт читать пиксели
    var d = id.data, ink = x.createImageData(B.w, B.h), red = x.createImageData(B.w, B.h);
    var N = B.w * B.h, RA = new Float32Array(N), IA = new Float32Array(N), inSun = new Uint8Array(N);
    for (var j = 0; j < B.h; j++) for (var i = 0; i < B.w; i++) {
      var o = (j * B.w + i) * 4, r = d[o], g = d[o + 1], b = d[o + 2], n = j * B.w + i;
      RA[n] = clamp((r - g - 60) / 120); IA[n] = clamp((255 - b) / 190);
      var dx = i + B.x - B.cx, dy = j + B.y - B.cy;
      inSun[n] = dx * dx + dy * dy < (B.r + 1.5) * (B.r + 1.5) ? 1 : 0;
    }
    // Жёлтый контур: там, где бык лежал на солнце, на исходнике контура нет (он сливался с солнцем).
    // Поэтому дорисовываем его сами — «раздуваем» красное тело на ~4 px и красим раздутое жёлтым.
    var R0 = 4, DIL = new Float32Array(N), off = [];
    for (var oy = -R0; oy <= R0; oy++) for (var ox = -R0; ox <= R0; ox++) {
      var dd = Math.sqrt(ox * ox + oy * oy);
      if (dd <= R0 + 0.5) off.push([ox, oy, clamp(R0 + 0.5 - dd)]); // мягкий край у границы радиуса
    }
    for (var j2 = 0; j2 < B.h; j2++) for (var i2 = 0; i2 < B.w; i2++) {
      var m = 0;
      for (var k2 = 0; k2 < off.length; k2++) {
        var xx = i2 + off[k2][0], yy = j2 + off[k2][1];
        if (xx < 0 || yy < 0 || xx >= B.w || yy >= B.h) continue;
        var v = RA[yy * B.w + xx] * off[k2][2]; if (v > m) m = v;
      }
      DIL[j2 * B.w + i2] = m;
    }
    for (var n2 = 0; n2 < N; n2++) {
      // вне солнца — исходный контур (он местами толще), но не тоньше дорисованного; на солнце — только дорисованный
      var ia = inSun[n2] ? DIL[n2] : Math.max(IA[n2], DIL[n2]);
      ink.data[n2 * 4 + 3] = ia * 255; red.data[n2 * 4 + 3] = RA[n2] * 255;
    }
    function up(mask) {
      var m = document.createElement("canvas"); m.width = B.w; m.height = B.h; m.getContext("2d").putImageData(mask, 0, 0);
      var u = document.createElement("canvas"); u.width = B.w * S; u.height = B.h * S;
      var ux = u.getContext("2d"); ux.imageSmoothingEnabled = true; ux.imageSmoothingQuality = "high";
      ux.drawImage(m, 0, 0, u.width, u.height);
      return ux.getImageData(0, 0, u.width, u.height).data;
    }
    var I = up(ink), R = up(red), W = B.w * S, H = B.h * S;
    var out = document.createElement("canvas"); out.width = W; out.height = H;
    var ox = out.getContext("2d"), od = ox.createImageData(W, H), q = od.data;
    for (var p = 0; p < W * H; p++) {
      var ia2 = edge(I[p * 4 + 3] / 255), ra2 = edge(R[p * 4 + 3] / 255), a = Math.max(ia2, ra2);
      if (a <= 0) continue;
      var k = ra2 / a; // доля красного: внутри тела 1, на контуре 0
      q[p * 4] = YEL[0] + (RED[0] - YEL[0]) * k;
      q[p * 4 + 1] = YEL[1] + (RED[1] - YEL[1]) * k;
      q[p * 4 + 2] = YEL[2] + (RED[2] - YEL[2]) * k;
      q[p * 4 + 3] = a * 255;
    }
    ox.putImageData(od, 0, 0);
    var half = (B.cx - B.x) * S;
    [[wl, 0, half], [wr, half, W - half]].forEach(function (pp) {
      var cv = document.createElement("canvas"); cv.width = pp[2]; cv.height = H;
      cv.getContext("2d").drawImage(out, pp[1], 0, pp[2], H, 0, 0, pp[2], H);
      pp[0].appendChild(cv);
    });
  };
  img.src = B.src;

  // Пыль из-под копыт: остаётся на месте, разлетается назад и тает
  function puff(sideEl, s) {
    var rb = box.getBoundingClientRect(), re = sideEl.getBoundingClientRect();
    var hoofX = s < 0 ? re.left + re.width * 0.12 : re.right - re.width * 0.12; // задние копыта — у внешнего края
    var el = document.createElement("span"); el.className = "puff";
    el.style.left = (hoofX - rb.left) + "px";
    box.appendChild(el);
    var drift = s * (20 + Math.random() * 30);
    el.animate([
      { transform: "translate(-50%, 0) scale(.35)", opacity: 0.55 },
      { transform: "translate(calc(-50% + " + drift + "px), -40%) scale(" + (1.4 + Math.random() * 0.8) + ")", opacity: 0 }
    ], { duration: 650 + Math.random() * 250, easing: "cubic-bezier(.2,.7,.3,1)" }).onfinish = function () { el.remove(); };
  }

  function run(sunDelay) {
    var sun = box.querySelector(".sun"), clip = box.querySelector(".sun-clip");
    // Восход: солнце поднимается из-за линии
    sun.animate([
      { transform: "translate(-50%, 10%) scale(.9)", opacity: 0, filter: "brightness(1.4)" },
      { transform: "translate(-50%, -50%) scale(1)", opacity: 1, filter: "brightness(1)" }
    ], { duration: 750, delay: sunDelay, easing: "cubic-bezier(.2,.8,.2,1)", fill: "both" });

    var D = 1400, t0 = performance.now() + sunDelay + 600, last = 0, ph = 0;
    var sides = [
      { el: wl, s: -1, blur: document.querySelector("#mbL feGaussianBlur"), f: "url(#mbL)" },
      { el: wr, s: 1, blur: document.querySelector("#mbR feGaussianBlur"), f: "url(#mbR)" }
    ];
    function frame(now) {
      var e = now - t0;
      if (e < 0) { last = now; requestAnimationFrame(frame); return; }
      var dt = Math.min(0.05, (now - (last || now)) / 1000); last = now;
      var p = Math.min(1, e / D), left = 1 - p;
      var dist = Math.pow(left, 1.7);                    // сначала мчатся, у солнца тормозят
      var speed = Math.pow(left, 0.7);
      var prevSin = Math.sin(ph);
      ph += dt * (2 * Math.PI / 0.3) * (0.35 + 0.65 * left); // частота шагов падает при торможении
      var sn = Math.sin(ph), cs = Math.cos(ph), amp = clamp(left * 1.5);
      var landed = prevSin > 0 && sn <= 0 && left > 0.1;
      sides.forEach(function (sd) {
        var s = sd.s, face = -s;                          // левый смотрит вправо, правый влево
        var air = Math.max(0, sn);                        // фаза полёта
        var y = -air * 11 * amp;                          // % высоты
        var pitch = face * cs * 7 * amp;                  // взлёт — нос вверх, приземление — клюёт вниз
        var sx = 1 + 0.08 * sn * amp, sy = 1 - 0.06 * sn * amp; // в полёте вытянут, на приземлении сжат
        sd.el.style.transform = "translate(" + (s * 75 * dist).toFixed(3) + "vw, " + y.toFixed(2) + "%) rotate(" + pitch.toFixed(2) + "deg) scale(" + sx.toFixed(3) + "," + sy.toFixed(3) + ")";
        var bl = 10 * speed * speed;
        if (sd.blur) sd.blur.setAttribute("stdDeviation", bl.toFixed(2) + " 0");
        sd.el.style.filter = bl > 0.3 ? sd.f : "none";
        if (landed) puff(sd.el, s);
      });
      if (p < 1) requestAnimationFrame(frame);
      else sides.forEach(function (sd) { sd.el.style.transform = "none"; sd.el.style.filter = "none"; });
    }
    requestAnimationFrame(frame);

    // Удар лбами: логотип вздрагивает, солнце коротко вспыхивает, пыль от столкновения
    var hit = sunDelay + 600 + D - 30;
    box.animate([
      { transform: "translateX(0)" }, { transform: "translateX(-4px)" }, { transform: "translateX(3px)" }, { transform: "translateX(0)" }
    ], { duration: 220, delay: hit });
    clip.animate([{ filter: "brightness(1)" }, { filter: "brightness(1.35)" }, { filter: "brightness(1)" }], { duration: 400, delay: hit });
    setTimeout(function () { puff(wl, -1); puff(wr, 1); }, hit);
    return hit;
  }

  return { run: run };
})();
