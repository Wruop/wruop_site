// Wruop · campo de partículas do hero.
// Versão discreta do sistema do Wruop Gravity (lab/gravity/): o W da logo oficial e a estrela laranja
// feitos de partículas que se reúnem na entrada, se afastam do cursor ou do dedo e voltam ao lugar.
// Mesma base física do Gravity: mola amortecida em passo fixo de 1/120 s, arrays tipados, desenho em lotes.
// O loop dorme quando tudo para, quando o hero sai da tela ou quando a aba fica oculta.
(() => {
  "use strict";

  const canvas = document.querySelector("[data-field]");
  const ctx = canvas && canvas.getContext ? canvas.getContext("2d") : null;
  if (!ctx) return;

  // Geometria copiada de assets/brand/wruop-mark.svg (logo oficial), com as mesmas transformações.
  const W_PATH = new Path2D("M 147 79 L 220 91 L 282 201 L 308 160 L 347 236 L 306 283 L 251 281 Z M 261 96 L 334 107 L 390 211 L 427 157 L 481 164 L 394 281 Q 388 287 376 287 L 360 283 Z");
  const STAR_PATH = new Path2D("M 0 -1 C 0.07 -0.3 0.3 -0.07 1 0 C 0.3 0.07 0.07 0.3 0 1 C -0.07 0.3 -0.3 0.07 -1 0 C -0.3 -0.07 -0.07 -0.3 0 -1 Z");
  const BOX = [62, 104, 452, 392]; // limites da marca nas coordenadas do SVG

  const STEP = 1 / 120;
  const MAX_FRAME = 0.1;
  const SPRING = 38;   // puxada até o lugar, 1/s²
  const DAMP = 7.4;    // amortecimento, 1/s
  const TONES = ["rgba(240,239,234,0.95)", "rgba(137,149,155,0.9)", "rgba(243,106,61,1)"];

  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const coarse = matchMedia("(pointer: coarse)");
  const memory = navigator.deviceMemory || 4;
  const cores = navigator.hardwareConcurrency || 4;
  const weak = memory <= 2 || cores <= 2 ? 0.55 : memory <= 4 || cores <= 4 ? 0.8 : 1;

  let W = 0, H = 0, dpr = 1, fieldR = 90, dot = 1.6;
  let n = 0, px, py, vx, vy, hx, hy, delay, tone;
  let toneEnd = [0, 0, 0];
  let clock = 0, acc = 0, last = 0, raf = 0, visible = true, calm = 0, built = false;
  const pointer = { x: -1e4, y: -1e4, active: false };

  /* ---------- Forma ---------- */

  const sampler = document.createElement("canvas");

  // Desenha a marca no tamanho que cabe em w × h e amostra a tinta numa grade com leve variação.
  function sample(w, h, count) {
    const bw = BOX[2] - BOX[0], bh = BOX[3] - BOX[1];
    const k = Math.min(w / bw, h / bh);
    const cw = Math.ceil(bw * k) + 4, ch = Math.ceil(bh * k) + 4;
    sampler.width = cw;
    sampler.height = ch;
    const o = sampler.getContext("2d", { willReadFrequently: true });
    const layer = (draw) => {
      o.setTransform(1, 0, 0, 1, 0, 0);
      o.clearRect(0, 0, cw, ch);
      o.setTransform(k, 0, 0, k, 2 - BOX[0] * k, 2 - BOX[1] * k);
      o.fillStyle = "#fff";
      draw(o);
      return o.getImageData(0, 0, cw, ch).data;
    };
    const wInk = layer((c) => { c.translate(246, 276); c.scale(1.06, 1.06); c.translate(-314, -183); c.fill(W_PATH, "evenodd"); });
    const sInk = layer((c) => { c.translate(404, 150); c.scale(40, 40); c.fill(STAR_PATH); });

    let ink = 0;
    for (let i = 3; i < wInk.length; i += 16) if (wInk[i] > 128 || sInk[i] > 128) ink += 4;
    const gap = Math.max(2.2, Math.sqrt(ink / count));
    const pts = [[], []];
    [wInk, sInk].forEach((d, g) => {
      const step = g ? gap * 0.62 : gap; // a estrela é pequena: grade mais densa para ficar legível
      for (let y = step / 2; y < ch; y += step) {
        for (let x = step / 2; x < cw; x += step) {
          if (d[((y | 0) * cw + (x | 0)) * 4 + 3] <= 128) continue;
          pts[g].push([x + (Math.random() - 0.5) * step * 0.35, y + (Math.random() - 0.5) * step * 0.35]);
        }
      }
    });
    return { pts, w: cw, h: ch, gap };
  }

  /* ---------- Layout ---------- */

  function layout() {
    const r = canvas.getBoundingClientRect();
    if (r.width < 10 || r.height < 10) return false;
    W = r.width;
    H = r.height;
    dpr = Math.min(window.devicePixelRatio || 1, coarse.matches ? 1.5 : 2);
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    fieldR = Math.max(56, Math.min(120, Math.min(W, H) * 0.2));

    const pad = Math.min(W, H) * 0.08;
    const budget = Math.round((coarse.matches ? 1500 : 2100) * weak * Math.min(1, Math.sqrt((W * H) / (680 * 600))));
    const s = sample(W - pad * 2, H - pad * 2, budget);
    dot = Math.max(1.2, Math.min(2.1, s.gap * 0.42));

    // Wordmark e estrela, centralizados no canvas. Tons: tinta, cinza (8%) e laranja só na estrela.
    const ox = (W - s.w) / 2, oy = (H - s.h) / 2;
    const all = [];
    s.pts[0].forEach((p) => all.push([p[0] + ox, p[1] + oy, Math.random() < 0.08 ? 1 : 0]));
    s.pts[1].forEach((p) => all.push([p[0] + ox, p[1] + oy, 2]));
    all.sort((a, b) => a[2] - b[2]);

    const m = all.length;
    const old = built ? { px, py, vx, vy, n } : null;
    px = new Float32Array(m); py = new Float32Array(m);
    vx = new Float32Array(m); vy = new Float32Array(m);
    hx = new Float32Array(m); hy = new Float32Array(m);
    delay = new Float32Array(m); tone = new Uint8Array(m);
    toneEnd = [0, 0, 0];
    for (let i = 0; i < m; i++) {
      const [x, y, t] = all[i];
      hx[i] = x; hy[i] = y; tone[i] = t;
      toneEnd[t] = i + 1;
      if (reduced.matches) {
        px[i] = x; py[i] = y; vx[i] = 0; vy[i] = 0;
      } else if (old && i < old.n) {
        px[i] = old.px[i]; py[i] = old.py[i]; vx[i] = old.vx[i]; vy[i] = old.vy[i];
      } else if (old) {
        px[i] = x; py[i] = y;
      } else {
        // Entrada: poeira espalhada que se reúne em onda, da esquerda para a direita.
        const a = Math.random() * Math.PI * 2, d = (0.35 + Math.random() * 0.65) * Math.max(W, H) * 0.55;
        px[i] = W / 2 + Math.cos(a) * d;
        py[i] = H / 2 + Math.sin(a) * d * 0.7;
        vx[i] = 0; vy[i] = 0;
        delay[i] = 0.15 + (x / W) * 0.7 + Math.random() * 0.35;
      }
    }
    for (let t = 1; t < 3; t++) if (toneEnd[t] < toneEnd[t - 1]) toneEnd[t] = toneEnd[t - 1];
    n = m;
    built = true;
    return true;
  }

  /* ---------- Física ---------- */

  function step(h) {
    clock += h;
    const R = fieldR, R2 = R * R, F = 4200;
    const springOn = !reduced.matches;
    let energy = 0;
    for (let i = 0; i < n; i++) {
      if (clock < delay[i]) {
        // Antes da vez: deriva lenta, sem cair nem parar.
        px[i] += Math.sin(clock * 0.9 + i) * 0.08;
        py[i] += Math.cos(clock * 0.7 + i * 1.3) * 0.08;
        energy += 1;
        continue;
      }
      let ax = (hx[i] - px[i]) * SPRING - vx[i] * DAMP;
      let ay = (hy[i] - py[i]) * SPRING - vy[i] * DAMP;
      if (pointer.active && springOn) {
        const dx = px[i] - pointer.x, dy = py[i] - pointer.y, d2 = dx * dx + dy * dy;
        if (d2 < R2 && d2 > 0.01) {
          const d = Math.sqrt(d2), f = 1 - d / R;
          ax += (dx / d) * f * f * F;
          ay += (dy / d) * f * f * F;
        }
      }
      vx[i] += ax * h; vy[i] += ay * h;
      px[i] += vx[i] * h; py[i] += vy[i] * h;
      energy += vx[i] * vx[i] + vy[i] * vy[i];
    }
    return energy / Math.max(1, n);
  }

  function draw() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    let start = 0;
    for (let t = 0; t < 3; t++) {
      const end = toneEnd[t];
      if (end <= start) continue;
      ctx.fillStyle = TONES[t];
      ctx.beginPath();
      const r = (t === 2 ? dot * 1.1 : dot) / 2;
      for (let i = start; i < end; i++) { ctx.moveTo(px[i] + r, py[i]); ctx.arc(px[i], py[i], r, 0, 6.2832); }
      ctx.fill();
      start = end;
    }
  }

  /* ---------- Loop ---------- */

  function frame(now) {
    raf = 0;
    const dt = Math.min(MAX_FRAME, last ? (now - last) / 1000 : STEP);
    last = now;
    acc += dt;
    let energy = 0, steps = 0;
    while (acc >= STEP && steps < 12) { energy = step(STEP); acc -= STEP; steps++; }
    draw();
    // Dorme quando a forma assentou e ninguém está mexendo.
    calm = energy < 0.02 && !pointer.active ? calm + dt : 0;
    if (calm > 0.6) { last = 0; return; }
    schedule();
  }

  function schedule() {
    if (reduced.matches) { if (n) draw(); return; } // movimento reduzido: forma parada, sem loop
    if (!raf && visible && !document.hidden && n) raf = requestAnimationFrame(frame);
  }
  function wake() { calm = 0; schedule(); }

  /* ---------- Entrada ---------- */

  function local(e) {
    const r = canvas.getBoundingClientRect();
    pointer.x = e.clientX - r.left;
    pointer.y = e.clientY - r.top;
  }
  // O campo pega o ponteiro numa área maior que o canvas (o hero inteiro), para a reação começar antes.
  const zone = canvas.closest(".hero") || canvas;
  zone.addEventListener("pointermove", (e) => {
    if (e.pointerType === "touch" && !e.isPrimary) return;
    local(e);
    pointer.active = true;
    wake();
  }, { passive: true });
  zone.addEventListener("pointerdown", (e) => { if (e.pointerType !== "mouse") { local(e); pointer.active = true; wake(); } }, { passive: true });
  const release = () => { pointer.active = false; pointer.x = pointer.y = -1e4; wake(); };
  zone.addEventListener("pointerleave", release);
  zone.addEventListener("pointerup", (e) => { if (e.pointerType !== "mouse") release(); });
  zone.addEventListener("pointercancel", release);
  window.addEventListener("blur", release);

  if ("IntersectionObserver" in window) {
    new IntersectionObserver((entries) => {
      visible = entries[entries.length - 1].isIntersecting;
      if (visible) wake(); else { if (raf) cancelAnimationFrame(raf); raf = 0; last = 0; }
    }).observe(canvas);
  }
  document.addEventListener("visibilitychange", () => { last = 0; if (!document.hidden) wake(); });
  if (reduced.addEventListener) reduced.addEventListener("change", () => { if (started && layout()) { draw(); wake(); } });

  let resizeTimer = 0, lastW = 0, lastH = 0, started = false;
  const onResize = () => {
    if (!started) return;
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      const r = canvas.getBoundingClientRect();
      if (Math.abs(r.width - lastW) < 2 && Math.abs(r.height - lastH) < 2) return;
      lastW = r.width; lastH = r.height;
      if (layout()) { draw(); wake(); }
    }, 120);
  };
  if ("ResizeObserver" in window) new ResizeObserver(onResize).observe(canvas);
  else window.addEventListener("resize", onResize);

  function start() {
    started = true;
    const r = canvas.getBoundingClientRect();
    lastW = r.width; lastH = r.height;
    if (!layout()) return;
    if (reduced.matches) { draw(); return; }
    wake();
  }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(start); else start();

  if (/[?&]debug\b/.test(location.search)) {
    window.wruopField = { get particles() { return n; }, get running() { return !!raf; }, get calm() { return calm; } };
  }
})();
