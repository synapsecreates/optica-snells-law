// refraction.js — the "what is refraction" interactive air/water demo
import { MEDIA, snell, deg2rad, rad2deg, fmt } from './physics.js';

export function initRefractionDemo() {
  const canvas = document.getElementById('refractCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const slider = document.getElementById('rf-angle');
  const angleOut = document.getElementById('rf-angle-out');
  const elT1 = document.getElementById('rf-theta1');
  const elT2 = document.getElementById('rf-theta2');
  const elN1 = document.getElementById('rf-n1');
  const elN2 = document.getElementById('rf-n2');
  const elBend = document.getElementById('rf-bend');

  const n1 = MEDIA.air.n, n2 = MEDIA.water.n;
  elN1.textContent = fmt(n1, 2);
  elN2.textContent = fmt(n2, 2);

  let angle = 35;
  let dragging = false;

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    canvas._cw = rect.width; canvas._ch = rect.height;
    draw();
  }

  function draw() {
    const W = canvas._cw || 900, H = canvas._ch || 520;
    const cx = W / 2, cy = H / 2;

    ctx.clearRect(0, 0, W, H);

    // air / water halves
    ctx.fillStyle = '#0c1526';
    ctx.fillRect(0, 0, W, cy);
    const waterGrad = ctx.createLinearGradient(0, cy, 0, H);
    waterGrad.addColorStop(0, 'rgba(63,168,224,0.28)');
    waterGrad.addColorStop(1, 'rgba(63,168,224,0.08)');
    ctx.fillStyle = waterGrad;
    ctx.fillRect(0, cy, W, H - cy);

    // subtle water ripple lines
    ctx.strokeStyle = 'rgba(87,230,255,0.08)';
    ctx.lineWidth = 1;
    for (let i = 1; i < 5; i++) {
      ctx.beginPath();
      ctx.moveTo(0, cy + i * (H - cy) / 5);
      for (let x = 0; x <= W; x += 20) {
        ctx.lineTo(x, cy + i * (H - cy) / 5 + Math.sin(x * 0.03 + i) * 3);
      }
      ctx.stroke();
    }

    // boundary line
    ctx.strokeStyle = 'rgba(238,243,251,0.25)';
    ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(W, cy); ctx.stroke();

    // normal (dashed)
    ctx.save();
    ctx.setLineDash([6, 6]);
    ctx.strokeStyle = 'rgba(238,243,251,0.35)';
    ctx.beginPath(); ctx.moveTo(cx, cy - 160); ctx.lineTo(cx, cy + 160); ctx.stroke();
    ctx.restore();

    ctx.font = '11px JetBrains Mono, monospace';
    ctx.fillStyle = 'rgba(238,243,251,0.4)';
    ctx.fillText('AIR', 14, 24);
    ctx.fillText('WATER', 14, H - 14);
    ctx.fillText('normal', cx + 8, cy - 150);

    const result = snell(n1, n2, angle);
    const theta1 = angle;
    const theta2 = result.theta2Deg;

    const rayLen = 220;
    // incident ray: comes from top-left down to (cx, cy)
    const a1 = deg2rad(theta1);
    const startX = cx - Math.sin(a1) * rayLen;
    const startY = cy - Math.cos(a1) * rayLen;

    drawRay(ctx, startX, startY, cx, cy, '#57e6ff', true);
    drawArc(ctx, cx, cy, theta1, -1, '#57e6ff');

    if (theta2 !== null) {
      const a2 = deg2rad(theta2);
      const endX = cx + Math.sin(a2) * rayLen;
      const endY = cy + Math.cos(a2) * rayLen;
      drawRay(ctx, cx, cy, endX, endY, '#9b7bff', true);
      drawArc(ctx, cx, cy, theta2, 1, '#9b7bff');
    }

    // junction glow
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 18);
    grad.addColorStop(0, 'rgba(255,255,255,0.9)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.arc(cx, cy, 18, 0, Math.PI * 2); ctx.fill();

    // update readouts
    elT1.textContent = fmt(theta1, 1) + '°';
    elT2.textContent = theta2 !== null ? fmt(theta2, 1) + '°' : '—';
    elBend.textContent = theta2 !== null ? (theta2 < theta1 ? 'Toward normal' : 'Away from normal') : 'n/a';
  }

  function drawRay(ctx, x1, y1, x2, y2, color, glow) {
    ctx.save();
    if (glow) { ctx.shadowColor = color; ctx.shadowBlur = 12; }
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    // arrowhead
    const ang = Math.atan2(y2 - y1, x2 - x1);
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - 9 * Math.cos(ang - 0.4), y2 - 9 * Math.sin(ang - 0.4));
    ctx.lineTo(x2 - 9 * Math.cos(ang + 0.4), y2 - 9 * Math.sin(ang + 0.4));
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    ctx.restore();
  }

  function drawArc(ctx, cx, cy, angDeg, side, color) {
    const r = 46;
    ctx.save();
    ctx.strokeStyle = color;
    ctx.globalAlpha = 0.7;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    if (side < 0) {
      ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + deg2rad(angDeg));
    } else {
      ctx.arc(cx, cy, r, Math.PI / 2, Math.PI / 2 - deg2rad(angDeg), true);
    }
    ctx.stroke();
    ctx.restore();
  }

  slider.addEventListener('input', () => {
    angle = +slider.value;
    angleOut.textContent = angle + '°';
    draw();
  });

  // drag directly on the incident ray
  function angleFromPointer(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    const cx = rect.left + rect.width / 2, cy = rect.top + rect.height / 2;
    const dx = clientX - cx, dy = cy - clientY; // note flipped y
    let a = rad2deg(Math.atan2(dx, dy));
    a = Math.max(0, Math.min(89, a));
    return a;
  }
  canvas.addEventListener('pointerdown', (e) => { dragging = true; updateFromPointer(e); });
  window.addEventListener('pointermove', (e) => { if (dragging) updateFromPointer(e); });
  window.addEventListener('pointerup', () => dragging = false);
  function updateFromPointer(e) {
    angle = angleFromPointer(e.clientX, e.clientY);
    slider.value = angle;
    angleOut.textContent = Math.round(angle) + '°';
    draw();
  }

  window.addEventListener('resize', resize);
  requestAnimationFrame(resize);
}
