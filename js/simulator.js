// simulator.js — the main Snell's Law simulator
import { MEDIA, snell, dispersedIndex, deg2rad, rad2deg, speedInMedium, fmt } from './physics.js';

export function initSimulator() {
  const canvas = document.getElementById('simCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const els = {
    angle: document.getElementById('sim-angle'),
    angleOut: document.getElementById('sim-angle-out'),
    m1: document.getElementById('sim-medium1'),
    m2: document.getElementById('sim-medium2'),
    preset: document.getElementById('sim-preset'),
    togNormal: document.getElementById('tog-normal'),
    togAngles: document.getElementById('tog-angles'),
    togWave: document.getElementById('tog-wavefronts'),
    togSlow: document.getElementById('tog-slowmo'),
    tir: document.getElementById('tirBanner'),
    formula: document.getElementById('sim-formula-sub'),
    outT1: document.getElementById('sim-out-t1'),
    outT2: document.getElementById('sim-out-t2'),
    outCrit: document.getElementById('sim-out-crit'),
    outSpeed: document.getElementById('sim-out-speed'),
    swatches: document.querySelectorAll('.wave-swatch'),
  };

  const state = { angle: 30, m1: 'air', m2: 'air', wavelength: 'red' };
  const waveColors = { red: '#ff6b6b', green: '#6bffa0', blue: '#6ba8ff' };

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    canvas._cw = rect.width; canvas._ch = rect.height;
  }

  let wavePhase = 0;

  function draw() {
    const W = canvas._cw || 960, H = canvas._ch || 520;
    const cx = W / 2, cy = H / 2;
    ctx.clearRect(0, 0, W, H);

    const med1 = MEDIA[state.m1], med2 = MEDIA[state.m2];
    const n1 = dispersedIndex(med1.n, state.wavelength);
    const n2 = dispersedIndex(med2.n, state.wavelength);

    // media backgrounds
    ctx.fillStyle = shade(med1.color, 0.10);
    ctx.fillRect(0, 0, W, cy);
    ctx.fillStyle = shade(med2.color, 0.16);
    ctx.fillRect(0, cy, W, H - cy);
    ctx.strokeStyle = 'rgba(238,243,251,0.2)';
    ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(W, cy); ctx.stroke();

    ctx.font = '11px JetBrains Mono, monospace';
    ctx.fillStyle = 'rgba(238,243,251,0.55)';
    ctx.fillText(`n₁ · ${med1.name}`, 16, 22);
    ctx.fillText(`n₂ · ${med2.name}`, 16, H - 14);

    if (els.togNormal.checked) {
      ctx.save();
      ctx.setLineDash([6, 6]);
      ctx.strokeStyle = 'rgba(238,243,251,0.3)';
      ctx.beginPath(); ctx.moveTo(cx, cy - 200); ctx.lineTo(cx, cy + 200); ctx.stroke();
      ctx.restore();
    }

    const result = snell(n1, n2, state.angle);
    const color = waveColors[state.wavelength];
    const rayLen = 240;
    const a1 = deg2rad(state.angle);
    const startX = cx - Math.sin(a1) * rayLen;
    const startY = cy - Math.cos(a1) * rayLen;

    drawRay(ctx, startX, startY, cx, cy, color);
    if (els.togAngles.checked) drawArc(ctx, cx, cy, state.angle, -1, color, 'θ₁');

    let tir = result.tir;
    if (!tir) {
      const a2 = deg2rad(result.theta2Deg);
      const endX = cx + Math.sin(a2) * rayLen;
      const endY = cy + Math.cos(a2) * rayLen;
      drawRay(ctx, cx, cy, endX, endY, color);
      if (els.togAngles.checked) drawArc(ctx, cx, cy, result.theta2Deg, 1, color, 'θ₂');
    } else {
      // reflect back up into medium 1
      const rAngle = state.angle;
      const ar = deg2rad(rAngle);
      const rx = cx - Math.sin(ar) * rayLen;
      const ry = cy - Math.cos(ar) * rayLen;
      // mirror across boundary horizontally (angle of reflection = angle of incidence)
      const reflX = cx + Math.sin(ar) * rayLen;
      drawRay(ctx, cx, cy, reflX, cy - Math.cos(ar) * rayLen, color);
    }

    if (els.togWave.checked) {
      drawWavefronts(ctx, cx, cy, a1, n1, W, H, 'incident', wavePhase);
      if (!tir) drawWavefronts(ctx, cx, cy, deg2rad(result.theta2Deg), n2, W, H, 'refracted', wavePhase);
    }

    // junction glow
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 20);
    grad.addColorStop(0, 'rgba(255,255,255,0.85)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.arc(cx, cy, 20, 0, Math.PI * 2); ctx.fill();

    // ---- readouts ----
    els.outT1.textContent = fmt(state.angle, 1) + '°';
    els.outT2.textContent = tir ? 'TIR' : fmt(result.theta2Deg, 1) + '°';
    els.outCrit.textContent = result.criticalAngleDeg !== null ? fmt(result.criticalAngleDeg, 1) + '°' : '—';
    els.outSpeed.textContent = fmt(speedInMedium(n2), 0) + ' km/s';
    els.formula.textContent = `${fmt(n1,3)} × sin(${fmt(state.angle,1)}°) = ${fmt(n2,3)} × sin(θ₂)  →  θ₂ = ${tir ? 'undefined (TIR)' : fmt(result.theta2Deg,1)+'°'}`;
    els.tir.classList.toggle('show', tir);
  }

  function drawWavefronts(ctx, cx, cy, angRad, n, W, H, kind, phase) {
    const spacing = 26 / Math.max(n, 0.6);
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.18)';
    ctx.lineWidth = 1;
    const dirX = Math.sin(angRad), dirY = Math.cos(angRad);
    const perpX = -dirY, perpY = dirX;
    const sign = kind === 'incident' ? -1 : 1;
    for (let d = (phase % spacing); d < 260; d += spacing) {
      const px = cx + sign * dirX * d;
      const py = cy + sign * dirY * d;
      ctx.beginPath();
      ctx.moveTo(px - perpX * 120, py - perpY * 120);
      ctx.lineTo(px + perpX * 120, py + perpY * 120);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawRay(ctx, x1, y1, x2, y2, color) {
    ctx.save();
    ctx.shadowColor = color; ctx.shadowBlur = 14;
    ctx.strokeStyle = color; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    const ang = Math.atan2(y2 - y1, x2 - x1);
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - 9 * Math.cos(ang - 0.4), y2 - 9 * Math.sin(ang - 0.4));
    ctx.lineTo(x2 - 9 * Math.cos(ang + 0.4), y2 - 9 * Math.sin(ang + 0.4));
    ctx.closePath(); ctx.fillStyle = color; ctx.fill();
    ctx.restore();
  }

  function drawArc(ctx, cx, cy, angDeg, side, color, label) {
    const r = 50;
    ctx.save();
    ctx.strokeStyle = color; ctx.globalAlpha = 0.7; ctx.lineWidth = 1.5;
    ctx.beginPath();
    if (side < 0) ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + deg2rad(angDeg));
    else ctx.arc(cx, cy, r, Math.PI / 2, Math.PI / 2 - deg2rad(angDeg), true);
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.font = '11px JetBrains Mono, monospace';
    ctx.fillStyle = color;
    const midAngle = side < 0 ? -Math.PI / 2 + deg2rad(angDeg) / 2 : Math.PI / 2 - deg2rad(angDeg) / 2;
    ctx.fillText(label, cx + Math.cos(midAngle) * (r + 14), cy + Math.sin(midAngle) * (r + 14));
    ctx.restore();
  }

  function shade(hex, alpha) {
    const c = hexToRgb(hex);
    return `rgba(${c.r},${c.g},${c.b},${alpha})`;
  }
  function hexToRgb(hex) {
    const v = hex.replace('#', '');
    const n = parseInt(v.length === 3 ? v.split('').map(c=>c+c).join('') : v, 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
  }

  // ---------- wiring ----------
  els.angle.addEventListener('input', () => { state.angle = +els.angle.value; els.angleOut.textContent = state.angle + '°'; draw(); });
  els.m1.addEventListener('change', () => { state.m1 = els.m1.value; els.preset.value = ''; draw(); });
  els.m2.addEventListener('change', () => { state.m2 = els.m2.value; els.preset.value = ''; draw(); });
  els.togNormal.addEventListener('change', draw);
  els.togAngles.addEventListener('change', draw);
  els.togWave.addEventListener('change', draw);

  els.preset.addEventListener('change', () => {
    const map = {
      'air-water': ['air','water'], 'water-air': ['water','air'],
      'air-glass': ['air','glass'], 'glass-air': ['glass','air'],
      'diamond-air': ['diamond','air'],
    };
    const pair = map[els.preset.value];
    if (pair) {
      state.m1 = pair[0]; state.m2 = pair[1];
      els.m1.value = pair[0]; els.m2.value = pair[1];
      draw();
    }
  });

  els.swatches.forEach(sw => sw.addEventListener('click', () => {
    els.swatches.forEach(s => s.classList.remove('active'));
    sw.classList.add('active');
    state.wavelength = sw.dataset.wl;
    draw();
  }));

  window.addEventListener('resize', () => { resize(); draw(); });
  resize();

  // animation loop for wavefront phase / slow motion
  function loop() {
    if (els.togWave.checked) {
      wavePhase += els.togSlow.checked ? 0.15 : 0.6;
      draw();
    }
    requestAnimationFrame(loop);
  }
  draw();
  loop();
}
