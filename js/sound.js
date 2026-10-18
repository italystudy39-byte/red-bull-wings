// Звук розлива, синтезированный в браузере (Web Audio), без аудиофайлов.
// play() — по клику: щелчок язычка и «пшшш». update(T, level) — каждый кадр: журчание струи,
// тон которого растёт по мере наполнения стакана, и шипение пузырьков после.
// Кнопка soundBtn включает и выключает звук; выбор запоминается в браузере.
function makePourSound(toggle) {
  var AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) { if (toggle) toggle.hidden = true; return null; }
  var on = true;
  try { on = localStorage.getItem("pourSound") !== "off"; } catch (e) {}
  function paint() {
    if (!toggle) return;
    toggle.setAttribute("aria-pressed", on ? "true" : "false");
    toggle.textContent = on ? "Sound: on" : "Sound: off";
  }
  paint();
  if (toggle) toggle.addEventListener("click", function () {
    on = !on; paint();
    try { localStorage.setItem("pourSound", on ? "on" : "off"); } catch (e) {}
    if (!on) stopAll();
  });

  var ctx = null, noise = null, pour = null, fizz = null;
  function init() {
    if (ctx) return;
    ctx = new AC();
    var len = ctx.sampleRate * 2, buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0);
    for (var i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    noise = buf;
  }
  function src() { var s = ctx.createBufferSource(); s.buffer = noise; s.loop = true; return s; }

  // Короткий шумовой всплеск через фильтр с огибающей
  function burst(type, freq, q, peak, attack, decay, at) {
    var s = src(), f = ctx.createBiquadFilter(), g = ctx.createGain(), t0 = ctx.currentTime + (at || 0);
    f.type = type; f.frequency.value = freq; f.Q.value = q;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(peak, t0 + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + attack + decay);
    s.connect(f); f.connect(g); g.connect(ctx.destination);
    s.start(t0, Math.random()); s.stop(t0 + attack + decay + 0.05);
  }

  // Непрерывный слой: шум → фильтр → громкость; управляется из update()
  function layer(type, freq, q) {
    var s = src(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    f.type = type; f.frequency.value = freq; f.Q.value = q; g.gain.value = 0;
    s.connect(f); f.connect(g); g.connect(ctx.destination); s.start(0, Math.random());
    return { s: s, f: f, g: g };
  }
  function stopAll() {
    [pour, fizz].forEach(function (l) { if (l) { try { l.s.stop(); } catch (e) {} } });
    pour = fizz = null;
  }

  return {
    play: function () {
      if (!on) return;
      init();
      if (ctx.state === "suspended") ctx.resume();
      stopAll();
      burst("lowpass", 1800, 0.8, 0.5, 0.004, 0.05, 0.12);   // щелчок язычка
      burst("bandpass", 4200, 0.6, 0.35, 0.015, 0.7, 0.2);   // «пшшш» газа
      burst("highpass", 7000, 0.5, 0.12, 0.02, 1.2, 0.25);   // шипение сверху
      pour = layer("bandpass", 600, 1.4);
      fizz = layer("highpass", 6500, 0.4);
    },
    update: function (T, level) {
      if (!ctx || !pour) return;
      var now = ctx.currentTime;
      var pouring = T > 1.55 && T < 4.65;
      // Журчание: громкость с дрожью, тон растёт по мере наполнения
      var wob = 0.75 + Math.sin(T * 47) * 0.15 + Math.sin(T * 13) * 0.1;
      pour.g.gain.setTargetAtTime(pouring ? 0.32 * wob : 0, now, pouring ? 0.03 : 0.08);
      pour.f.frequency.setTargetAtTime(450 + level * 1100 + Math.sin(T * 31) * 120, now, 0.05);
      // Шипение пузырьков: сильнее при наливе и потом медленно затихает
      var fz = T < 0 ? 0 : pouring ? 0.07 : Math.max(0, 0.06 * (1 - (T - 4.65) / 6));
      fizz.g.gain.setTargetAtTime(level > 0.02 ? fz * (0.6 + Math.random() * 0.4) : 0, now, 0.04);
      if (T < 0 && level <= 0) stopAll();
    }
  };
}
