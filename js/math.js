// math.js — refractive-index/critical-angle graph + light equation motion
import { rad2deg, fmt } from './physics.js';

export function initMath() {
  const canvas = document.getElementById('graphCanvas');
  const slider = document.getElementById('graph-n1');
  const out = document.getElementById('graph-n1-out');
  if (!canvas || !slider) return;
  const ctx = canvas.getContext('2d');

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    canvas._cw = rect.width; canvas._ch = rect.height;
    draw();
  }

  function criticalAngle(n1) {
    if (n1 <= 1) return null;
    return rad2deg(Math.asin(1 / n1));
  }

  function draw() {
    const W = canvas._cw || 600, H = canvas._ch || 280;
    const pad = { l: 44, r: 16, t: 16, b: 30 };
    ctx.clearRect(0, 0, W, H);

    const plotW = W - pad.l - pad.r, plotH = H - pad.t - pad.b;
    const nMin = 1.01, nMax = 2.5;

    // axes
    ctx.strokeStyle = 'rgba(238,243,251,0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(pad.l, pad.t); ctx.lineTo(pad.l, H - pad.b); ctx.lineTo(W - pad.r, H - pad.b);
    ctx.stroke();

    ctx.font = '10px JetBrains Mono, monospace';
    ctx.fillStyle = 'rgba(238,243,251,0.4)';
    ctx.fillText('90°', pad.l - 30, pad.t + 8);
    ctx.fillText('0°', pad.l - 22, H - pad.b + 4);
    ctx.fillText('n₁ →', W - pad.r - 24, H - pad.b + 20);

    // curve: critical angle vs n1
    ctx.beginPath();
    ctx.strokeStyle = '#57e6ff';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#57e6ff'; ctx.shadowBlur = 8;
    for (let i = 0; i <= 120; i++) {
      const n1 = nMin + (nMax - nMin) * (i / 120);
      const angle = criticalAngle(n1);
      const x = pad.l + plotW * ((n1 - nMin) / (nMax - nMin));
      const y = pad.t + plotH * (1 - angle / 90);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.shadowBlur = 0;

    // current n1 marker
    const n1 = +slider.value / 100;
    out.textContent = fmt(n1, 2);
    const angle = criticalAngle(n1);
    const mx = pad.l + plotW * ((n1 - nMin) / (nMax - nMin));
    const my = pad.t + plotH * (1 - angle / 90);

    ctx.strokeStyle = 'rgba(155,123,255,0.4)';
    ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.moveTo(mx, H - pad.b); ctx.lineTo(mx, my); ctx.lineTo(pad.l, my); ctx.stroke();
    ctx.setLineDash([]);

    ctx.beginPath();
    ctx.fillStyle = '#9b7bff';
    ctx.shadowColor = '#9b7bff'; ctx.shadowBlur = 10;
    ctx.arc(mx, my, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#eef3fb';
    ctx.font = '11px JetBrains Mono, monospace';
    ctx.fillText(`θc = ${fmt(angle, 1)}°`, mx + 10, my - 10);
  }

  slider.addEventListener('input', draw);
  window.addEventListener('resize', resize);
  resize();

  // equation shimmer sweep on scroll into view (GSAP + ScrollTrigger if present)
  if (window.gsap && window.ScrollTrigger) {
    document.querySelectorAll('.eq').forEach(eq => {
      gsap.fromTo(eq, { backgroundPosition: '200% 0' }, {
        backgroundPosition: '0% 0', duration: 1.4, ease: 'power2.out',
        scrollTrigger: { trigger: eq, start: 'top 80%' }
      });
      gsap.from(eq, {
        opacity: 0, y: 16, duration: 0.8, ease: 'power2.out',
        scrollTrigger: { trigger: eq, start: 'top 85%' }
      });
    });
    gsap.utils.toArray('.derivation-step').forEach((step, i) => {
      gsap.from(step, {
        opacity: 0, x: -16, duration: 0.6, delay: i * 0.05, ease: 'power2.out',
        scrollTrigger: { trigger: step, start: 'top 90%' }
      });
    });
  }
}
