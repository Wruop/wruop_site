// Wruop Gravity · Experiment 001
// The word WRUOP drawn in particles on a Canvas 2D. Physics runs on a fixed 1/120 s step,
// so a 60 Hz and a 120 Hz screen produce the same motion; rendering happens once per frame.
(() => {
  "use strict";

  const root = document.documentElement;
  const canvas = document.getElementById("lab");
  const ctx = canvas && canvas.getContext ? canvas.getContext("2d") : null;
  if (!ctx) { root.classList.remove("js"); return; }

  const WORD = "WRUOP";
  const FONT = '"Sora", system-ui, sans-serif';
  const STEP = 1 / 120;      // physics step, seconds
  const MAX_FRAME = 0.1;     // a longer gap (hitch, tab switch) is simulated as 0.1 s
  const MAX_STEPS = 12;
  const TONES = ["rgba(246,247,250,0.92)", "rgba(176,183,193,0.8)", "rgba(148,176,222,0.88)"];
  const TAU = Math.PI * 2;
  const SPRING = 44;         // pull toward the letter, 1/s²
  const DAMP = 8.6;          // damping on the way back, 1/s

  const coarse = matchMedia("(pointer: coarse)");
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const memory = navigator.deviceMemory || 4;
  const cores = navigator.hardwareConcurrency || 4;
  const weak = memory <= 2 || cores <= 2 ? 0.6 : memory <= 4 || cores <= 4 ? 0.8 : 1;
  let budget = Math.round((coarse.matches ? 1100 : 3000) * weak);
  const MIN_BUDGET = coarse.matches ? 260 : 450;

  // Geometry, in CSS pixels.
  let W = 0, H = 0, dpr = 1, floorY = 0, spacing = 4, radius = 1.5, fieldR = 110;
  let wordBox = { cx: 0, cy: 0 };

  // Particles as parallel typed arrays: cheap to iterate, no per-frame allocation.
  let n = 0;
  let px, py, vx, vy, tx, ty, seed, size, delay;
  let toneEnd = [0, 0, 0]; // particles are ordered by tone so each tone is one fill

  let mode = "reconstruct", modeTime = 0, clock = 0, settleTime = 0, maxDelay = 0;
  const pointer = { x: -1e4, y: -1e4, active: false, kind: "mouse" };
  const ripples = [];

  const buttons = Array.from(document.querySelectorAll(".control"));
  const announce = document.getElementById("announce");
  const LABELS = { gravity: "Gravidade ligada", chaos: "Partículas espalhadas", reconstruct: "Reconstruindo a palavra" };

  /* ---------- Layout ---------- */

  function measure() {
    W = window.innerWidth;
    H = window.innerHeight;
    dpr = Math.min(window.devicePixelRatio || 1, coarse.matches ? 1.5 : 2);
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    fieldR = Math.max(70, Math.min(150, Math.min(W, H) * 0.13));
    const controls = document.querySelector(".controls");
    const top = controls ? controls.getBoundingClientRect().top : H;
    floorY = Math.min(H - 8, top - 16);
  }

  // Draws the word off-screen and samples its ink into target points.
  const sampler = document.createElement("canvas");
  function sampleWord() {
    sampler.width = Math.ceil(W);
    sampler.height = Math.ceil(H);
    const o = sampler.getContext("2d", { willReadFrequently: true });
    o.clearRect(0, 0, sampler.width, sampler.height);

    const narrow = W < 640;
    o.font = `800 100px ${FONT}`;
    const m = o.measureText(WORD);
    const unitW = (m.actualBoundingBoxLeft || 0) + (m.actualBoundingBoxRight || m.width);
    const unitH = m.actualBoundingBoxAscent || 72;
    const fs = Math.min((W * (narrow ? 0.86 : 0.78)) / unitW * 100, (H * (narrow ? 0.2 : 0.3)) / unitH * 100, 560);

    o.font = `800 ${fs}px ${FONT}`;
    o.textAlign = "center";
    o.textBaseline = "alphabetic";
    const mm = o.measureText(WORD);
    const asc = mm.actualBoundingBoxAscent || fs * 0.72;
    const desc = mm.actualBoundingBoxDescent || 0;
    const cy = H * (narrow ? 0.4 : 0.43);
    const base = cy + (asc - desc) / 2;
    o.fillStyle = "#fff";
    o.fillText(WORD, W / 2, base);

    const y0 = Math.max(0, Math.floor(base - asc) - 2);
    const y1 = Math.min(sampler.height, Math.ceil(base + desc) + 2);
    wordBox = { cx: W / 2, cy };
    root.style.setProperty("--word-bottom", `${Math.round(y1)}px`);

    const w = sampler.width, h = y1 - y0;
    if (h <= 0) return [];
    const data = o.getImageData(0, y0, w, h).data;

    // Estimate the ink area, then pick the grid spacing that lands near the budget.
    let ink = 0;
    for (let y = 0; y < h; y += 2) for (let x = 0; x < w; x += 2) if (data[(y * w + x) * 4 + 3] > 128) ink++;
    spacing = Math.max(2.2, Math.sqrt((ink * 4) / budget));
    radius = Math.max(0.6, Math.min(1.25, spacing * 0.2));

    const pts = [];
    const j = spacing * 0.3;
    for (let y = spacing / 2; y < h; y += spacing) {
      for (let x = spacing / 2; x < w; x += spacing) {
        if (data[((y | 0) * w + (x | 0)) * 4 + 3] > 128) {
          pts.push(x + (Math.random() - 0.5) * j, y0 + y + (Math.random() - 0.5) * j);
        }
      }
    }
    return pts;
  }

  // Rebuilds targets; existing particles keep their place and simply flow to the new word.
  function rebuild(scatterNew) {
    const pts = sampleWord();
    const count = pts.length / 2;
    const old = { n, px, py, vx, vy };

    // Shuffle so tone groups and the cut on a budget drop are spread over the word.
    const order = new Uint32Array(count);
    for (let i = 0; i < count; i++) order[i] = i;
    for (let i = count - 1; i > 0; i--) { const k = (Math.random() * (i + 1)) | 0; const t = order[i]; order[i] = order[k]; order[k] = t; }

    n = count;
    px = new Float32Array(n); py = new Float32Array(n);
    vx = new Float32Array(n); vy = new Float32Array(n);
    tx = new Float32Array(n); ty = new Float32Array(n);
    seed = new Float32Array(n); size = new Float32Array(n); delay = new Float32Array(n);

    for (let i = 0; i < n; i++) {
      const p = order[i];
      tx[i] = pts[p * 2];
      ty[i] = pts[p * 2 + 1];
      seed[i] = Math.random();
      // Mostly fine dust, a few brighter grains.
      const r = Math.random();
      size[i] = radius * 2 * (r < 0.85 ? 0.7 + r * 0.45 : 1.25 + (r - 0.85) * 3);
      if (i < old.n) {
        px[i] = old.px[i]; py[i] = old.py[i]; vx[i] = old.vx[i]; vy[i] = old.vy[i];
      } else if (scatterNew) {
        // Dust spread across the room, drifting in from below.
        px[i] = Math.random() * W;
        py[i] = H * (0.25 + Math.random() * 0.85);
        vx[i] = (Math.random() - 0.5) * 30;
        vy[i] = -Math.random() * 40;
      } else {
        px[i] = tx[i]; py[i] = ty[i];
      }
    }
    toneEnd = [Math.round(n * 0.6), Math.round(n * 0.9), n];
  }

  /* ---------- Modes ---------- */

  function setDelays(spread) {
    maxDelay = 0;
    for (let i = 0; i < n; i++) {
      const d = Math.hypot(tx[i] - px[i], ty[i] - py[i]);
      delay[i] = spread * (Math.min(1, d / Math.max(W, H)) * 0.55 + seed[i] * 0.45);
      if (delay[i] > maxDelay) maxDelay = delay[i];
    }
  }

  function setMode(next, fromKey) {
    const calm = reduced.matches;
    if (next === "chaos") {
      const scale = Math.max(0.55, Math.min(1.25, Math.min(W, H) / 800)) * (calm ? 0.25 : 1);
      for (let i = 0; i < n; i++) {
        const a = Math.atan2(py[i] - wordBox.cy, px[i] - wordBox.cx) + (Math.random() - 0.5) * 1.8;
        const s = (260 + Math.pow(Math.random(), 2) * 1500) * scale;
        vx[i] += Math.cos(a) * s;
        vy[i] += Math.sin(a) * s - 160 * scale;
      }
      mode = "chaos";
    } else if (next === "gravity") {
      if (mode !== "gravity") for (let i = 0; i < n; i++) vx[i] += (Math.random() - 0.5) * 50;
      mode = "gravity";
    } else {
      setDelays(calm ? 0 : 0.9);
      mode = "reconstruct";
    }
    modeTime = 0;
    settleTime = 0;
    buttons.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.mode === next)));
    if (announce) announce.textContent = LABELS[next];
    if (fromKey) {
      const b = buttons.find((x) => x.dataset.mode === next);
      if (b) b.focus({ preventScroll: true });
    }
    wake();
  }

  /* ---------- Physics ---------- */

  // Grid buckets for particle contacts while piling up under gravity.
  let head = new Int32Array(0), next = new Int32Array(0);
  function collide() {
    const cell = spacing * 0.95;
    const cols = Math.ceil(W / cell) + 1, rows = Math.ceil(H / cell) + 1;
    if (head.length !== cols * rows) head = new Int32Array(cols * rows);
    if (next.length !== n) next = new Int32Array(n);
    head.fill(-1);
    for (let i = 0; i < n; i++) {
      const c = Math.min(cols - 1, Math.max(0, (px[i] / cell) | 0)) + Math.min(rows - 1, Math.max(0, (py[i] / cell) | 0)) * cols;
      next[i] = head[c];
      head[c] = i;
    }
    const d2min = cell * cell;
    for (let i = 0; i < n; i++) {
      const cx = Math.min(cols - 1, Math.max(0, (px[i] / cell) | 0));
      const cy = Math.min(rows - 1, Math.max(0, (py[i] / cell) | 0));
      for (let oy = 0; oy <= 1; oy++) {
        const yy = cy + oy;
        if (yy >= rows) continue;
        for (let ox = -1; ox <= 1; ox++) {
          if (oy === 0 && ox < 0) continue;
          const xx = cx + ox;
          if (xx < 0 || xx >= cols) continue;
          for (let j = head[xx + yy * cols]; j !== -1; j = next[j]) {
            if (oy === 0 && ox === 0 && j <= i) continue;
            const dx = px[j] - px[i], dy = py[j] - py[i];
            const d2 = dx * dx + dy * dy;
            if (d2 >= d2min || d2 < 1e-6) continue;
            const d = Math.sqrt(d2), nx = dx / d, ny = dy / d;
            const push = (cell - d) * 0.5;
            px[i] -= nx * push; py[i] -= ny * push;
            px[j] += nx * push; py[j] += ny * push;
            const rv = (vx[j] - vx[i]) * nx + (vy[j] - vy[i]) * ny;
            if (rv < 0) {
              const imp = rv * 0.55;
              vx[i] += nx * imp; vy[i] += ny * imp;
              vx[j] -= nx * imp; vy[j] -= ny * imp;
            }
          }
        }
      }
    }
  }

  let energy = 0;
  function step(h) {
    clock += h;
    modeTime += h;
    const t = clock;
    const forming = mode === "reconstruct" || mode === "form";
    const gravity = mode === "gravity";
    const chaos = mode === "chaos";
    const breathe = reduced.matches ? 0 : 1;
    const g = Math.max(900, Math.min(2200, H * 1.9));
    const drag = chaos ? 0.55 : gravity ? 0.12 : 0;
    const R = fieldR, R2 = R * R, F = 5600;
    const pa = pointer.active;
    const vmax = 2600;
    let e = 0;

    for (let i = 0; i < n; i++) {
      let ax = 0, ay = 0;
      const s = seed[i];

      if (forming) {
        let r = 1;
        if (mode === "reconstruct") {
          r = (modeTime - delay[i]) / 1.1;
          r = r < 0 ? 0 : r > 1 ? 1 : r * r * (3 - 2 * r);
        }
        // Each particle breathes around its place on two slow, unrelated waves.
        const ox = breathe * (Math.sin(t * 0.83 + s * 41.3) * 1.15 + Math.sin(t * 0.31 + s * 97.1) * 0.75);
        const oy = breathe * (Math.cos(t * 0.71 + s * 23.9) * 1.15 + Math.cos(t * 0.27 + s * 61.7) * 0.75);
        ax += (tx[i] + ox - px[i]) * SPRING * r;
        ay += (ty[i] + oy - py[i]) * SPRING * r;
        const c = DAMP * (0.3 + 0.7 * r);
        ax -= vx[i] * c;
        ay -= vy[i] * c;
      } else {
        if (gravity) ay += g;
        ax -= vx[i] * drag;
        ay -= vy[i] * drag;
        if (chaos && breathe) {
          // A faint current keeps the cloud alive without pulling it back together.
          ax += Math.sin(py[i] * 0.006 + t * 0.45 + s * 6.3) * 26;
          ay += Math.cos(px[i] * 0.006 + t * 0.38 + s * 4.1) * 26;
        }
      }

      if (pa) {
        const dx = px[i] - pointer.x, dy = py[i] - pointer.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < R2 && d2 > 0.01) {
          const d = Math.sqrt(d2);
          let f = 1 - d / R;
          f = f * f * F;
          ax += (dx / d) * f;
          ay += (dy / d) * f;
        }
      }

      let nvx = vx[i] + ax * h, nvy = vy[i] + ay * h;
      if (nvx > vmax) nvx = vmax; else if (nvx < -vmax) nvx = -vmax;
      if (nvy > vmax) nvy = vmax; else if (nvy < -vmax) nvy = -vmax;
      let nx = px[i] + nvx * h, ny = py[i] + nvy * h;

      if (!forming) {
        const r = radius;
        if (nx < r) { nx = r; nvx = -nvx * 0.5; }
        else if (nx > W - r) { nx = W - r; nvx = -nvx * 0.5; }
        if (ny < r) { ny = r; nvy = -nvy * 0.5; }
        if (ny > floorY) {
          ny = floorY;
          if (nvy > 0) nvy = nvy > 70 ? -nvy * (gravity ? 0.3 : 0.5) : 0;
          nvx *= gravity ? 0.92 : 0.985;
        }
      }

      vx[i] = nvx; vy[i] = nvy; px[i] = nx; py[i] = ny;
      e += nvx * nvx + nvy * nvy;
    }

    if (gravity) collide();

    energy = n ? e / n : 0;
    if (mode === "reconstruct" && modeTime > maxDelay + 2.2) mode = "form";

    for (let k = ripples.length - 1; k >= 0; k--) {
      ripples[k].t += h;
      if (ripples[k].t > 0.9) ripples.splice(k, 1);
    }
  }

  // Click or tap: a short radial push and a ring that fades out.
  function ripple(x, y) {
    const R = fieldR * 1.9, R2 = R * R, power = reduced.matches ? 160 : 620;
    for (let i = 0; i < n; i++) {
      const dx = px[i] - x, dy = py[i] - y, d2 = dx * dx + dy * dy;
      if (d2 < R2 && d2 > 0.01) {
        const d = Math.sqrt(d2), f = (1 - d / R) * power;
        vx[i] += (dx / d) * f;
        vy[i] += (dy / d) * f;
      }
    }
    ripples.push({ x, y, t: 0, r: R });
    if (ripples.length > 4) ripples.shift();
    wake();
  }

  /* ---------- Rendering ---------- */

  function draw() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);

    let from = 0;
    for (let b = 0; b < 3; b++) {
      const to = toneEnd[b];
      ctx.fillStyle = TONES[b];
      ctx.beginPath();
      for (let i = from; i < to; i++) {
        const r = size[i] / 2;
        ctx.moveTo(px[i] + r, py[i]);
        ctx.arc(px[i], py[i], r, 0, TAU);
      }
      ctx.fill();
      from = to;
    }

    for (const r of ripples) {
      const k = r.t / 0.9;
      const ease = 1 - Math.pow(1 - k, 3);
      ctx.strokeStyle = `rgba(217,219,223,${(0.32 * (1 - k)).toFixed(3)})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(r.x, r.y, 6 + ease * r.r, 0, Math.PI * 2);
      ctx.stroke();
    }

    // The field of influence, shown only for a mouse so the touch view stays clean.
    if (pointer.active && pointer.kind === "mouse") {
      ctx.strokeStyle = "rgba(217,219,223,0.07)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(pointer.x, pointer.y, fieldR, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = "rgba(255,255,255,0.75)";
      ctx.fillRect(pointer.x - 1, pointer.y - 1, 2, 2);
    }
  }

  /* ---------- Loop and load governor ---------- */

  let raf = 0, last = 0, acc = 0;
  const gov = { time: 0, frames: 0, work: 0, best: 0, low: 0, cool: 0, warm: 3, cuts: 0 };

  // Cuts the particle count only after three straight overloaded seconds, at most four times,
  // and never adds particles back: density changes rarely and only in one direction.
  function govern(raw, work) {
    // Tab switches already reset the clock; only a gap over 1 s (debugger, sleep) is ignored.
    if (raw > 1) return;
    gov.time += raw;
    gov.frames++;
    gov.work += work;
    if (gov.time < 1) return;
    const fps = gov.frames / gov.time;
    const load = gov.work / gov.time;
    gov.time = gov.frames = gov.work = 0;
    gov.best = Math.max(gov.best * 0.97, Math.min(fps, 165));
    if (gov.warm > 0) { gov.warm--; return; }
    if (gov.cool > 0) { gov.cool--; gov.low = 0; return; }
    const overloaded = load > 0.62 || (gov.best > 50 && fps < gov.best * 0.7);
    gov.low = overloaded ? gov.low + 1 : 0;
    if (gov.low >= 3 && budget > MIN_BUDGET && gov.cuts < 4) {
      budget = Math.max(MIN_BUDGET, Math.round(budget * 0.75));
      gov.cuts++;
      gov.low = 0;
      gov.cool = 6;
      rebuild(false);
      if (mode === "form") { setDelays(0.4); mode = "reconstruct"; modeTime = 0; }
    }
  }

  function frame(now) {
    raf = 0;
    const raw = last ? (now - last) / 1000 : STEP;
    last = now;
    const t0 = performance.now();

    acc += Math.min(raw, MAX_FRAME);
    let steps = 0;
    while (acc >= STEP && steps < MAX_STEPS) { step(STEP); acc -= STEP; steps++; }
    if (steps === MAX_STEPS) acc = 0;
    draw();

    govern(raw, (performance.now() - t0) / 1000);

    // With reduced motion nothing breathes, so the loop sleeps once everything is still.
    if (reduced.matches && !pointer.active && !ripples.length && mode !== "reconstruct" && mode !== "chaos") {
      settleTime = energy < 4 ? settleTime + raw : 0;
      if (settleTime > 0.6) { last = 0; return; }
    }
    schedule();
  }

  function schedule() { if (!raf && !document.hidden) raf = requestAnimationFrame(frame); }
  function wake() { settleTime = 0; schedule(); }

  /* ---------- Input ---------- */

  function local(e) {
    const r = canvas.getBoundingClientRect();
    pointer.x = e.clientX - r.left;
    pointer.y = e.clientY - r.top;
    pointer.kind = e.pointerType === "mouse" ? "mouse" : "touch";
  }
  canvas.addEventListener("pointermove", (e) => {
    if (e.pointerType !== "mouse" && !pointer.active) return;
    local(e);
    pointer.active = true;
    wake();
  });
  canvas.addEventListener("pointerdown", (e) => {
    local(e);
    pointer.active = true;
    if (e.pointerType !== "mouse" && canvas.setPointerCapture) canvas.setPointerCapture(e.pointerId);
    ripple(pointer.x, pointer.y);
  });
  const release = (e) => { if (e.pointerType !== "mouse" || e.type === "pointerleave") pointer.active = false; };
  canvas.addEventListener("pointerup", release);
  canvas.addEventListener("pointercancel", release);
  canvas.addEventListener("pointerleave", release);
  window.addEventListener("blur", () => { pointer.active = false; });

  buttons.forEach((b) => b.addEventListener("click", () => setMode(b.dataset.mode, false)));
  const KEYS = { g: "gravity", c: "chaos", r: "reconstruct" };
  document.addEventListener("keydown", (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey || e.repeat) return;
    const m = KEYS[e.key.toLowerCase()];
    if (m) { e.preventDefault(); setMode(m, true); }
  });

  let resizeTimer = 0;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      measure();
      rebuild(false);
      if (mode === "form" || mode === "reconstruct") { setDelays(0.35); mode = "reconstruct"; modeTime = 0; }
      gov.cool = 3;
      wake();
    }, 140);
  });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) { if (raf) cancelAnimationFrame(raf); raf = 0; last = 0; }
    else wake();
  });
  reduced.addEventListener && reduced.addEventListener("change", wake);

  // Read-only numbers for checking the governor; only with ?debug in the address.
  if (/[?&]debug\b/.test(location.search)) {
    window.wruopGravity = { get particles() { return n; }, get budget() { return budget; }, get cuts() { return gov.cuts; }, get mode() { return mode; } };
  }

  /* ---------- Start ---------- */

  function start() {
    measure();
    rebuild(!reduced.matches);
    if (reduced.matches) { mode = "form"; }
    else { setDelays(1.4); mode = "reconstruct"; }
    root.classList.add("is-ready");
    wake();
  }

  // Sample the word only once Sora is in, or after a short wait with the fallback face.
  const fontReady = document.fonts && document.fonts.load
    ? Promise.race([document.fonts.load(`800 100px ${FONT}`), new Promise((r) => setTimeout(r, 2500))])
    : Promise.resolve();
  fontReady.then(start, start);
})();
