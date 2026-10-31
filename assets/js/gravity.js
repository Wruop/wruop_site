// Wruop Gravity · Experiment 001
// Particles on a Canvas 2D that take the shape of a walking duck or the Wruop logo.
// Physics runs on a fixed 1/120 s step, so a 60 Hz and a 120 Hz screen produce the same motion;
// rendering happens once per frame.
(() => {
  "use strict";

  const root = document.documentElement;
  const canvas = document.getElementById("lab");
  const ctx = canvas && canvas.getContext ? canvas.getContext("2d") : null;
  if (!ctx) { root.classList.remove("js"); return; }

  const STEP = 1 / 120;      // physics step, seconds
  const MAX_FRAME = 0.1;     // a longer gap (hitch, tab switch) is simulated as 0.1 s
  const MAX_STEPS = 12;
  const TAU = Math.PI * 2;
  const TONES = ["rgba(246,247,250,0.92)", "rgba(176,183,193,0.8)", "rgba(148,176,222,0.88)"];
  const SPRING = 44;         // pull toward the shape, 1/s²
  const DAMP = 8.6;          // damping on the way back, 1/s

  const coarse = matchMedia("(pointer: coarse)");
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const memory = navigator.deviceMemory || 4;
  const cores = navigator.hardwareConcurrency || 4;
  const weak = memory <= 2 || cores <= 2 ? 0.6 : memory <= 4 || cores <= 4 ? 0.8 : 1;
  let budget = Math.round((coarse.matches ? 1100 : 3000) * weak);
  const MIN_BUDGET = coarse.matches ? 300 : 500;

  // Geometry, in CSS pixels.
  let W = 0, H = 0, dpr = 1, floorY = 0, spacing = 4, radius = 1.5, fieldR = 110;

  // Particles as parallel typed arrays: cheap to iterate, no per-frame allocation.
  let n = 0;
  let px, py, vx, vy, seed, size, delay;
  let toneEnd = [0, 0, 0]; // particles are ordered by tone so each tone is one fill

  // Shapes, each sampled into exactly n local points (centred on the shape).
  // A point's group says which rigid part it rides on: 0 body, 1 and 2 the duck's legs.
  const shapes = { duck: null, logo: null, hand: null };
  let logoArt = null;        // paths read from the brand SVG
  let userForm = "duck";     // what the visitor chose
  let form = "duck";         // what the particles are building right now

  let mode = "reconstruct", modeTime = 0, clock = 0, settleTime = 0, maxDelay = 0;
  const pointer = { x: -1e4, y: -1e4, active: false, kind: "mouse" };
  const ripples = [];

  // The duck's walk: position along the stage, facing (-1..1, eased through 0 on a turn), stride.
  const walk = { t: 0, x: 0, face: 1, phase: 0, legA: 0, legB: 0, bob: 0 };

  const controls = document.querySelector(".controls");
  const copy = document.querySelector(".copy");
  const buttons = Array.from(document.querySelectorAll(".control"));
  const modeButtons = buttons.filter((b) => b.dataset.mode);
  const formButton = buttons.find((b) => b.dataset.form);
  const announce = document.getElementById("announce");
  const LABELS = {
    gravity: "Gravidade ligada",
    chaos: "Partículas espalhadas",
    reconstruct: "Reconstruindo a forma",
    logo: "Forma: logo da Wruop",
    duck: "Forma: pato",
  };

  /* ---------- Shapes ---------- */

  // Rounded rectangle without relying on ctx.roundRect (older Safari).
  function rr(o, x, y, w, h, r) {
    o.beginPath();
    o.moveTo(x + r, y);
    o.arcTo(x + w, y, x + w, y + h, r);
    o.arcTo(x + w, y + h, x, y + h, r);
    o.arcTo(x, y + h, x, y, r);
    o.arcTo(x, y, x + w, y, r);
    o.closePath();
    o.fill();
  }

  const DUCK = {
    box: [-62, -50, 68, 58],
    legs: [[-8, 32], [10, 32]],
    body(o) {
      o.beginPath(); o.ellipse(0, 8, 44, 27, 0, 0, TAU); o.fill();
      o.beginPath(); o.moveTo(-34, -2); o.quadraticCurveTo(-50, -6, -60, -16); o.quadraticCurveTo(-52, 6, -36, 16); o.closePath(); o.fill();
      o.beginPath(); o.moveTo(14, -18); o.lineTo(44, -22); o.lineTo(40, 2); o.lineTo(12, 6); o.closePath(); o.fill();
      o.beginPath(); o.arc(30, -29, 18, 0, TAU); o.fill();
      o.beginPath(); o.moveTo(44, -35); o.quadraticCurveTo(62, -34, 67, -28); o.quadraticCurveTo(59, -21, 44, -22); o.closePath(); o.fill();
      // Eye and wing are cut out so the silhouette reads as a duck, not a blob.
      o.globalCompositeOperation = "destination-out";
      o.beginPath(); o.arc(35, -33, 3.4, 0, TAU); o.fill();
      o.lineWidth = 3.4; o.lineCap = "round";
      o.beginPath(); o.moveTo(-24, 0); o.quadraticCurveTo(-2, 20, 22, 2); o.stroke();
      o.globalCompositeOperation = "source-over";
    },
    leg(o, x) {
      o.fillRect(x - 2.4, 28, 4.8, 22);
      o.beginPath(); o.moveTo(x - 4, 48); o.lineTo(x + 12, 50); o.lineTo(x + 10, 57); o.lineTo(x - 5, 57); o.closePath(); o.fill();
    },
  };

  const HAND = {
    box: [-54, -96, 62, 100],
    draw(o) {
      rr(o, -12, -94, 24, 100, 12);          // middle finger
      rr(o, -39, -30, 24, 46, 12);           // index, folded
      rr(o, 15, -30, 24, 46, 12);            // ring, folded
      rr(o, 41, -20, 19, 38, 9.5);           // little finger, folded
      rr(o, -40, -6, 100, 68, 18);           // fist
      rr(o, -24, 58, 66, 40, 10);            // wrist
      o.save(); o.translate(-26, 18); o.rotate(-0.22); rr(o, -26, -10, 50, 20, 10); o.restore(); // thumb across the front
      o.globalCompositeOperation = "destination-out";
      o.lineWidth = 2.6; o.lineCap = "round";
      [-13.5, 13.5, 40].forEach((x) => { o.beginPath(); o.moveTo(x, -4); o.lineTo(x, 12); o.stroke(); });
      o.save(); o.translate(-26, 18); o.rotate(-0.22);
      o.beginPath(); o.moveTo(-22, -11); o.lineTo(22, -11); o.stroke();
      o.restore();
      o.globalCompositeOperation = "source-over";
    },
  };

  function drawLogo(o) {
    for (const p of logoArt.paths) {
      o.save();
      if (p.t) { o.translate(p.t[0], p.t[1]); o.scale(p.t[2], p.t[2]); }
      o.fill(p.path, p.rule);
      o.restore();
    }
  }

  // Reads the official wordmark from the brand SVG so the particles trace the real logo.
  function loadLogo() {
    return fetch("assets/brand/wruop-logo-white.svg")
      .then((r) => (r.ok ? r.text() : Promise.reject(r.status)))
      .then((txt) => {
        const doc = new DOMParser().parseFromString(txt, "image/svg+xml");
        const vb = (doc.documentElement.getAttribute("viewBox") || "").split(/[\s,]+/).map(Number);
        const paths = Array.from(doc.querySelectorAll("path")).map((el) => {
          const m = /translate\(([-\d.]+)[ ,]+([-\d.]+)\)\s*scale\(([-\d.]+)\)/.exec(el.getAttribute("transform") || "");
          return { path: new Path2D(el.getAttribute("d")), rule: el.getAttribute("fill-rule") === "evenodd" ? "evenodd" : "nonzero", t: m ? [+m[1], +m[2], +m[3]] : null };
        });
        if (vb.length !== 4 || !paths.length) throw new Error("logo");
        logoArt = { box: [vb[0], vb[1], vb[0] + vb[2], vb[1] + vb[3]], paths };
      })
      .catch(() => { logoArt = null; });
  }

  const sampler = document.createElement("canvas");

  // Draws parts at the size that fits maxW × maxH and samples their ink on one shared grid.
  // Earlier parts win a grid cell, so the duck's body is not double-filled where the legs start.
  function sampleShape(box, parts, maxW, maxH, count) {
    const bw = box[2] - box[0], bh = box[3] - box[1];
    const k = Math.min(maxW / bw, maxH / bh);
    const cw = Math.ceil(bw * k) + 4, ch = Math.ceil(bh * k) + 4;
    sampler.width = cw;
    sampler.height = ch;
    const o = sampler.getContext("2d", { willReadFrequently: true });
    const ox = 2 - box[0] * k, oy = 2 - box[1] * k; // canvas position of the shape's origin
    const centre = [ox + ((box[0] + box[2]) / 2) * k, oy + ((box[1] + box[3]) / 2) * k];

    const layers = parts.map((draw) => {
      o.setTransform(1, 0, 0, 1, 0, 0);
      o.clearRect(0, 0, cw, ch);
      o.setTransform(k, 0, 0, k, ox, oy);
      o.fillStyle = "#fff";
      o.strokeStyle = "#fff";
      draw(o);
      return o.getImageData(0, 0, cw, ch).data;
    });

    let ink = 0;
    for (const d of layers) for (let y = 0; y < ch; y += 2) for (let x = 0; x < cw; x += 2) if (d[(y * cw + x) * 4 + 3] > 128) ink++;
    const gap = Math.max(1.6, Math.sqrt((ink * 4) / count));

    const pts = [];
    const taken = new Set();
    const jit = gap * 0.3;
    layers.forEach((d, g) => {
      for (let y = gap / 2, row = 0; y < ch; y += gap, row++) {
        for (let x = gap / 2, col = 0; x < cw; x += gap, col++) {
          const key = row * 100000 + col;
          if (taken.has(key) || d[((y | 0) * cw + (x | 0)) * 4 + 3] <= 128) continue;
          taken.add(key);
          pts.push([x + (Math.random() - 0.5) * jit - centre[0], y + (Math.random() - 0.5) * jit - centre[1], g]);
        }
      }
    });
    if (!pts.length) pts.push([0, 0, 0]);

    // Exactly `count` points: drop at random, or double up with a little offset.
    for (let i = pts.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; const t = pts[i]; pts[i] = pts[j]; pts[j] = t; }
    const lx = new Float32Array(count), ly = new Float32Array(count), grp = new Uint8Array(count);
    for (let i = 0; i < count; i++) {
      const p = pts[i % pts.length];
      const extra = i >= pts.length;
      lx[i] = p[0] + (extra ? (Math.random() - 0.5) * gap * 0.8 : 0);
      ly[i] = p[1] + (extra ? (Math.random() - 0.5) * gap * 0.8 : 0);
      grp[i] = p[2];
    }
    return { lx, ly, grp, k, gap, centre, origin: [ox, oy] };
  }

  /* ---------- Layout ---------- */

  function measure() {
    W = window.innerWidth;
    H = window.innerHeight;
    dpr = Math.min(window.devicePixelRatio || 1, coarse.matches ? 1.5 : 2);
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    fieldR = Math.max(70, Math.min(150, Math.min(W, H) * 0.13));
    let top = H;
    if (controls) top = Math.min(top, controls.getBoundingClientRect().top);
    if (copy) top = Math.min(top, copy.getBoundingClientRect().top);
    floorY = Math.min(H - 8, top - 14);
  }

  // The stage between the header and the lower interface, where shapes are centred.
  function stage() {
    const topLimit = Math.min(H * 0.16, 120);
    const bottomLimit = floorY - 10;
    return { cx: W / 2, cy: (topLimit + bottomLimit) / 2, h: Math.max(120, bottomLimit - topLimit) };
  }

  function buildShapes() {
    const narrow = W < 640;
    const st = stage();
    const duck = sampleShape(DUCK.box, [DUCK.body, (o) => DUCK.leg(o, DUCK.legs[0][0]), (o) => DUCK.leg(o, DUCK.legs[1][0])],
      W * (narrow ? 0.62 : 0.34), st.h * 0.7, budget);
    duck.pivots = [[0, 0], ...DUCK.legs.map(([x, y]) => [duck.origin[0] + x * duck.k - duck.centre[0], duck.origin[1] + y * duck.k - duck.centre[1]])];
    duck.width = (DUCK.box[2] - DUCK.box[0]) * duck.k;
    shapes.duck = duck;

    shapes.hand = sampleShape(HAND.box, [HAND.draw], W * (narrow ? 0.62 : 0.4), st.h * 0.92, budget);
    shapes.logo = logoArt ? sampleShape(logoArt.box, [drawLogo], W * (narrow ? 0.86 : 0.7), st.h * 0.62, budget) : null;

    spacing = duck.gap;
    radius = Math.max(0.6, Math.min(1.25, spacing * 0.2));
  }

  // (Re)creates the particles; existing ones keep their place and flow to the new shapes.
  function rebuild(scatterNew) {
    const old = { n, px, py, vx, vy };
    n = budget;
    buildShapes();
    px = new Float32Array(n); py = new Float32Array(n);
    vx = new Float32Array(n); vy = new Float32Array(n);
    seed = new Float32Array(n); size = new Float32Array(n); delay = new Float32Array(n);
    const st = stage();
    for (let i = 0; i < n; i++) {
      seed[i] = Math.random();
      // Mostly fine dust, a few brighter grains.
      const r = Math.random();
      size[i] = radius * 2 * (r < 0.85 ? 0.7 + r * 0.45 : 1.25 + (r - 0.85) * 3);
      if (i < old.n) {
        px[i] = old.px[i]; py[i] = old.py[i]; vx[i] = old.vx[i]; vy[i] = old.vy[i];
      } else if (scatterNew) {
        px[i] = Math.random() * W;
        py[i] = H * (0.25 + Math.random() * 0.85);
        vx[i] = (Math.random() - 0.5) * 30;
        vy[i] = -Math.random() * 40;
      } else {
        px[i] = st.cx + shapes.duck.lx[i];
        py[i] = st.cy + shapes.duck.ly[i];
      }
    }
    toneEnd = [Math.round(n * 0.6), Math.round(n * 0.9), n];
    if (formButton) formButton.disabled = !shapes.logo;
  }

  /* ---------- Targets ---------- */

  function advanceWalk(h) {
    const sh = shapes.duck;
    const st = stage();
    const range = Math.max(0, Math.min(W * 0.2, (W - sh.width) / 2 - 24));
    if (reduced.matches || range < 8) {
      walk.x = st.cx; walk.legA = walk.legB = walk.bob = 0;
      walk.face += (1 - walk.face) * Math.min(1, 5 * h);
      return;
    }
    const w = TAU / 22;                         // one lap every 22 s
    walk.t += h;
    walk.x = st.cx + range * Math.sin(w * walk.t);
    const v = range * w * Math.cos(w * walk.t); // px/s
    const facing = v >= 0 ? 1 : -1;
    walk.face += (facing - walk.face) * Math.min(1, 4 * h); // passes through 0: the duck turns on the spot
    const pace = Math.abs(v) / (range * w);
    walk.phase += h * TAU * (0.6 + 1.8 * pace);
    const swing = 0.5 * (0.35 + 0.65 * pace);
    walk.legA = Math.sin(walk.phase) * swing;
    walk.legB = -walk.legA;
    walk.bob = -Math.abs(Math.sin(walk.phase)) * sh.k * 2.4 * pace;
  }

  // Writes the target for particle i into tgt[0], tgt[1].
  const tgt = [0, 0];
  let frameShape = null, fx = 0, fy = 0, sx = 1, cosA = 1, sinA = 0, cosB = 1, sinB = 0;
  function prepareTargets() {
    const st = stage();
    frameShape = shapes[form] || shapes.duck;
    if (form === "duck") {
      fx = walk.x || st.cx; fy = st.cy + walk.bob; sx = walk.face;
      cosA = Math.cos(walk.legA); sinA = Math.sin(walk.legA);
      cosB = Math.cos(walk.legB); sinB = Math.sin(walk.legB);
    } else {
      fx = st.cx; fy = st.cy; sx = 1; cosA = cosB = 1; sinA = sinB = 0;
    }
  }
  function targetOf(i) {
    const s = frameShape;
    let lx = s.lx[i], ly = s.ly[i];
    const g = s.grp[i];
    if (g && s.pivots) {
      const pv = s.pivots[g], c = g === 1 ? cosA : cosB, sn = g === 1 ? sinA : sinB;
      const dx = lx - pv[0], dy = ly - pv[1];
      lx = pv[0] + dx * c - dy * sn;
      ly = pv[1] + dx * sn + dy * c;
    }
    tgt[0] = fx + lx * sx;
    tgt[1] = fy + ly;
  }

  /* ---------- Modes ---------- */

  function setDelays(spread) {
    maxDelay = 0;
    prepareTargets();
    for (let i = 0; i < n; i++) {
      targetOf(i);
      const d = Math.hypot(tgt[0] - px[i], tgt[1] - py[i]);
      delay[i] = spread * (Math.min(1, d / Math.max(W, H)) * 0.55 + seed[i] * 0.45);
      if (delay[i] > maxDelay) maxDelay = delay[i];
    }
  }

  function scatter(power) {
    const st = stage();
    const scale = Math.max(0.55, Math.min(1.25, Math.min(W, H) / 800)) * power;
    for (let i = 0; i < n; i++) {
      const a = Math.atan2(py[i] - st.cy, px[i] - st.cx) + (Math.random() - 0.5) * 1.8;
      const s = (260 + Math.pow(Math.random(), 2) * 1500) * scale;
      vx[i] += Math.cos(a) * s;
      vy[i] += Math.sin(a) * s - 160 * scale;
    }
  }

  function pressed() {
    const m = mode === "form" || mode === "reconstruct" ? "reconstruct" : mode;
    modeButtons.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.mode === m)));
    if (formButton) formButton.setAttribute("aria-pressed", String(userForm === "logo"));
  }

  function setMode(next) {
    if (next === "chaos") {
      scatter(reduced.matches ? 0.25 : 1);
      mode = "chaos";
    } else if (next === "gravity") {
      if (mode !== "gravity") for (let i = 0; i < n; i++) vx[i] += (Math.random() - 0.5) * 50;
      mode = "gravity";
    } else {
      form = userForm;
      setDelays(reduced.matches ? 0 : 0.9);
      mode = "reconstruct";
    }
    modeTime = 0;
    settleTime = 0;
    pressed();
    say(LABELS[next]);
    wake();
  }

  function toggleForm() {
    if (!shapes.logo) return;
    userForm = userForm === "logo" ? "duck" : "logo";
    form = userForm;
    setDelays(reduced.matches ? 0 : 0.7);
    mode = "reconstruct";
    modeTime = 0;
    pressed();
    say(LABELS[userForm]);
    wake();
  }

  function say(text) { if (announce) announce.textContent = text; }

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
    if (egg.active) eggStep(h);
    if (form === "duck" && (mode === "form" || mode === "reconstruct")) advanceWalk(h);
    prepareTargets();

    const t = clock;
    const forming = mode === "reconstruct" || mode === "form";
    const gravity = mode === "gravity";
    const chaos = mode === "chaos";
    const breathe = reduced.matches || egg.active ? 0 : 1;
    const g = Math.max(900, Math.min(2200, H * 1.9));
    const drag = chaos ? 0.55 : gravity ? 0.12 : 0;
    const R = fieldR, R2 = R * R, F = 5600;
    const pa = pointer.active && !egg.active;
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
        targetOf(i);
        // Each particle breathes around its place on two slow, unrelated waves.
        const ox = breathe * (Math.sin(t * 0.83 + s * 41.3) * 1.15 + Math.sin(t * 0.31 + s * 97.1) * 0.75);
        const oy = breathe * (Math.cos(t * 0.71 + s * 23.9) * 1.15 + Math.cos(t * 0.27 + s * 61.7) * 0.75);
        ax += (tgt[0] + ox - px[i]) * SPRING * r;
        ay += (tgt[1] + oy - py[i]) * SPRING * r;
        const c = DAMP * (0.3 + 0.7 * r);
        ax -= vx[i] * c;
        ay -= vy[i] * c;
      } else {
        if (gravity) ay += g;
        ax -= vx[i] * drag;
        ay -= vy[i] * drag;
        if (chaos && !reduced.matches) {
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
    if (egg.active) return;
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
      ctx.arc(r.x, r.y, 6 + ease * r.r, 0, TAU);
      ctx.stroke();
    }

    // The field of influence, shown only for a mouse so the touch view stays clean.
    if (pointer.active && pointer.kind === "mouse" && !egg.active) {
      ctx.strokeStyle = "rgba(217,219,223,0.07)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(pointer.x, pointer.y, fieldR, 0, TAU);
      ctx.stroke();
      ctx.fillStyle = "rgba(255,255,255,0.75)";
      ctx.fillRect(pointer.x - 1, pointer.y - 1, 2, 2);
    }
  }

  /* ---------- A small private moment ---------- */
  // Rapidly alternating two specific controls makes the lab lose its patience for a few seconds.
  // Count: 6 presses where each differs from the one before (5 alternations), all within 2.5 s of the
  // first. Pressing the same control twice does not count and does not reset; any other control resets.

  const EGG_WINDOW = 2.5;   // s, from the first press of the run
  const EGG_TURNS = 5;      // alternations needed
  const EGG_PAIR = ["chaos", "reconstruct"];
  const egg = { active: false, t: 0, stage: 0, prevForm: "duck", focus: null, quietUntil: 0, run: [] };

  // Returns true when this press set it off (the press itself is then swallowed).
  function notePress(m) {
    const now = performance.now() / 1000;
    if (egg.active || now < egg.quietUntil) { egg.run.length = 0; return false; }
    if (EGG_PAIR.indexOf(m) < 0) { egg.run.length = 0; return false; }
    const run = egg.run;
    if (run.length && now - run[0].t > EGG_WINDOW) run.length = 0;
    if (run.length && run[run.length - 1].m === m) return false;
    run.push({ m, t: now });
    if (run.length - 1 >= EGG_TURNS) { run.length = 0; startEgg(); return true; }
    return false;
  }

  function startEgg() {
    egg.active = true;
    egg.t = 0;
    egg.stage = 0;
    egg.prevForm = userForm;
    egg.focus = controls && controls.contains(document.activeElement) ? document.activeElement : null;
    pointer.active = false;
    ripples.length = 0;
    if (controls) {
      controls.classList.add("is-hidden");
      controls.inert = true;
      controls.setAttribute("aria-hidden", "true");
    }
    scatter(reduced.matches ? 0.35 : 1.35);
    mode = "chaos";
    modeTime = 0;
    say("WRUOP.exe perdeu a paciência.");
    wake();
  }

  // One clock, advanced with the simulation: the hold never stretches and never restarts.
  function eggStep(h) {
    egg.t += h;
    const gather = reduced.matches ? 0.15 : 0.3;
    const release = gather + 4.6;
    if (egg.stage === 0 && egg.t >= gather) {
      egg.stage = 1;
      form = "hand";
      setDelays(reduced.matches ? 0 : 0.25);
      mode = "reconstruct";
      modeTime = 0;
    } else if (egg.stage === 1 && egg.t >= release) {
      egg.stage = 2;
      scatter(reduced.matches ? 0.12 : 0.3);
      mode = "chaos";
      modeTime = 0;
    } else if (egg.stage === 2 && egg.t >= release + (reduced.matches ? 0.2 : 0.45)) {
      endEgg();
    }
  }

  function endEgg() {
    egg.active = false;
    egg.run.length = 0;
    egg.quietUntil = performance.now() / 1000 + 2;
    userForm = egg.prevForm;
    form = userForm;
    setDelays(reduced.matches ? 0 : 0.8);
    mode = "reconstruct";
    modeTime = 0;
    if (controls) {
      controls.inert = false;
      controls.removeAttribute("aria-hidden");
      controls.classList.remove("is-hidden");
    }
    pressed();
    if (egg.focus && document.body.contains(egg.focus)) egg.focus.focus({ preventScroll: true });
    egg.focus = null;
    say(LABELS[userForm]);
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

    // With reduced motion nothing breathes or walks, so the loop sleeps once everything is still.
    if (reduced.matches && !egg.active && !pointer.active && !ripples.length && mode !== "reconstruct" && mode !== "chaos") {
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
    if (egg.active || (e.pointerType !== "mouse" && !pointer.active)) return;
    local(e);
    pointer.active = true;
    wake();
  });
  canvas.addEventListener("pointerdown", (e) => {
    if (egg.active) return;
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

  function command(name, fromKey) {
    if (egg.active) return;
    if (notePress(name)) return;
    if (name === "logo") toggleForm(); else setMode(name);
    if (fromKey) {
      const b = buttons.find((x) => (x.dataset.mode || x.dataset.form) === name);
      if (b && !b.disabled) b.focus({ preventScroll: true });
    }
  }

  buttons.forEach((b) => b.addEventListener("click", () => command(b.dataset.mode || b.dataset.form, false)));
  const KEYS = { g: "gravity", c: "chaos", r: "reconstruct", w: "logo" };
  document.addEventListener("keydown", (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey || e.repeat) return;
    const m = KEYS[(e.key || "").toLowerCase()];
    if (!m) return;
    e.preventDefault();
    command(m, true);
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
  if (reduced.addEventListener) reduced.addEventListener("change", wake);

  // Read-only numbers for checking the governor and the shapes; only with ?debug in the address.
  if (/[?&]debug\b/.test(location.search)) {
    window.wruopGravity = {
      get particles() { return n; }, get budget() { return budget; }, get cuts() { return gov.cuts; },
      get mode() { return mode; }, get form() { return form; }, get userForm() { return userForm; },
      get egg() { return { active: egg.active, stage: egg.stage, t: +egg.t.toFixed(2), run: egg.run.length }; },
    };
  }

  /* ---------- Start ---------- */

  function start() {
    measure();
    rebuild(!reduced.matches);
    walk.x = stage().cx;
    form = userForm;
    if (reduced.matches) { mode = "form"; } else { setDelays(1.4); mode = "reconstruct"; }
    pressed();
    root.classList.add("is-ready");
    wake();
  }

  const fontReady = document.fonts && document.fonts.ready ? Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 1500))]) : Promise.resolve();
  Promise.all([loadLogo(), fontReady]).then(start, start);
})();
