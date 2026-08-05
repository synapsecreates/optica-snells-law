// signature-ray.js — the site's signature element: a single light ray that runs
// down the page and visibly *refracts* at every section boundary it crosses,
// tying the site's own motion language to the subject it teaches.

export function initSignatureRay() {
  const canvas = document.getElementById('signature-ray');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let w, h, dpr;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  window.addEventListener('resize', resize);

  // Boundaries = each <section>'s top offset in document space; the ray "refracts"
  // a little more sharply every time the viewport crosses one.
  let boundaries = [];
  function computeBoundaries() {
    boundaries = Array.from(document.querySelectorAll('section')).map(s => s.offsetTop);
  }
  computeBoundaries();
  window.addEventListener('resize', computeBoundaries);
  setTimeout(computeBoundaries, 800); // after fonts/layout settle

  let t = 0;
  const xBase = () => w * 0.94;

  function draw() {
    t += 0.012;
    ctx.clearRect(0, 0, w, h);

    const scrollY = window.scrollY || window.pageYOffset;
    const docH = document.documentElement.scrollHeight - window.innerHeight;
    const progress = docH > 0 ? scrollY / docH : 0;

    // find how many boundaries we've crossed to vary the bend phase/hue
    let crossed = 0;
    for (const b of boundaries) if (scrollY + h * 0.5 > b) crossed++;

    const segments = 7;
    const points = [];
    for (let i = 0; i <= segments; i++) {
      const fy = (i / segments) * h;
      const localBend = Math.sin(fy * 0.015 + t + crossed * 0.6) * (10 + crossed * 1.2);
      const drift = Math.sin(t * 0.6 + i) * 6;
      points.push({ x: xBase() + localBend + drift, y: fy });
    }

    const hue1 = 189 + Math.sin(t * 0.3) * 6;   // cyan
    const hue2 = 262 + Math.cos(t * 0.25) * 8;  // violet
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, `hsla(${hue1}, 90%, 65%, 0)`);
    grad.addColorStop(Math.min(0.15 + progress * 0.2, 0.5), `hsla(${hue1}, 90%, 65%, 0.55)`);
    grad.addColorStop(0.6, `hsla(${(hue1 + hue2) / 2}, 85%, 68%, 0.4)`);
    grad.addColorStop(1, `hsla(${hue2}, 85%, 70%, 0.05)`);

    ctx.lineWidth = 1.4;
    ctx.strokeStyle = grad;
    ctx.shadowColor = `hsla(${hue1}, 90%, 65%, 0.5)`;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    points.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
    ctx.stroke();

    // little glow node at every "boundary crossing" point along the ray
    for (let i = 1; i < points.length - 1; i += 2) {
      const p = points[i];
      const r = 1.6 + Math.sin(t * 2 + i) * 0.8;
      ctx.beginPath();
      ctx.fillStyle = `hsla(${hue1}, 95%, 75%, 0.5)`;
      ctx.arc(p.x, p.y, Math.max(r, 0.4), 0, Math.PI * 2);
      ctx.fill();
    }

    requestAnimationFrame(draw);
  }
  requestAnimationFrame(draw);
}
