// photonlab.js — "Photon Playground": Matter.js for placement, collision & (optional)
// gravity; custom vector optics for refraction across glass/prism boundaries.
import { MEDIA, vNorm, vReflect, vRefract, vScale } from './physics.js';

export function initPhotonLab() {
  const canvas = document.getElementById('photonCanvas');
  if (!canvas || typeof Matter === 'undefined') return;
  const ctx = canvas.getContext('2d');
  const { Engine, World, Bodies, Body, Composite, Query } = Matter;

  const engine = Engine.create();
  engine.gravity.y = 0;
  const world = engine.world;

  const GLASS_N = MEDIA.glass.n;
  let tool = 'photon';
  let gravityOn = false;
  const photonMeta = new Map(); // body.id -> { trail:[], inside:false, hue }
  const opticMeta = new Map();  // body.id -> { type, n }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    canvas._cw = rect.width; canvas._ch = rect.height;
  }
  window.addEventListener('resize', resize);
  resize();

  // ---------- creation helpers ----------
  function addMirror(x, y) {
    const b = Bodies.rectangle(x, y, 130, 12, {
      isStatic: true, restitution: 1, friction: 0,
      chamfer: { radius: 2 },
    });
    opticMeta.set(b.id, { type: 'mirror' });
    World.add(world, b);
  }
  function addGlass(x, y) {
    const b = Bodies.rectangle(x, y, 150, 100, { isStatic: true, isSensor: true });
    opticMeta.set(b.id, { type: 'glass', n: GLASS_N });
    World.add(world, b);
  }
  function addPrism(x, y) {
    const R = 62;
    const verts = [0, 1, 2].map(i => {
      const a = -Math.PI / 2 + (i * Math.PI * 2) / 3;
      return { x: x + Math.cos(a) * R, y: y + Math.sin(a) * R };
    });
    const b = Bodies.fromVertices(x, y, [verts], { isStatic: true, isSensor: true }, true);
    opticMeta.set(b.id, { type: 'prism', n: GLASS_N });
    World.add(world, b);
  }
  function addPhoton(x, y, dir) {
    const speed = 6.5;
    const b = Bodies.circle(x, y, 4, { restitution: 1, friction: 0, frictionAir: 0, density: 0.0006 });
    Body.setVelocity(b, vScale(dir, speed));
    photonMeta.set(b.id, { trail: [], inside: false, hue: 190 + Math.random() * 40 });
    World.add(world, b);
  }

  // ---------- pointer interaction ----------
  let dragTarget = null, dragMode = null;
  let aiming = false, aimStart = null, aimNow = null;

  function localPoint(e) {
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  canvas.addEventListener('pointerdown', (e) => {
    const p = localPoint(e);
    const hits = Query.point(Composite.allBodies(world), p);
    const hit = hits.find(b => opticMeta.has(b.id));

    if (hit) {
      dragTarget = hit;
      const dx = p.x - hit.position.x, dy = p.y - hit.position.y;
      const dist = Math.hypot(dx, dy);
      const bounds = hit.bounds;
      const radius = Math.max(bounds.max.x - bounds.min.x, bounds.max.y - bounds.min.y) / 2;
      dragMode = dist > radius * 0.55 ? 'rotate' : 'translate';
      return;
    }

    if (tool === 'photon') {
      aiming = true; aimStart = p; aimNow = p;
    } else if (tool === 'mirror') {
      addMirror(p.x, p.y);
    } else if (tool === 'glass') {
      addGlass(p.x, p.y);
    } else if (tool === 'prism') {
      addPrism(p.x, p.y);
    }
  });

  window.addEventListener('pointermove', (e) => {
    const p = localPoint(e);
    if (dragTarget) {
      if (dragMode === 'translate') {
        Body.setPosition(dragTarget, { x: p.x, y: p.y });
      } else {
        const ang = Math.atan2(p.y - dragTarget.position.y, p.x - dragTarget.position.x);
        Body.setAngle(dragTarget, ang);
      }
    } else if (aiming) {
      aimNow = p;
    }
  });

  window.addEventListener('pointerup', (e) => {
    if (aiming) {
      const p = localPoint(e);
      const dx = p.x - aimStart.x, dy = p.y - aimStart.y;
      const dist = Math.hypot(dx, dy);
      const dir = dist > 4 ? vNorm({ x: dx, y: dy }) : { x: 1, y: 0 };
      addPhoton(aimStart.x, aimStart.y, dir);
      aiming = false; aimStart = null; aimNow = null;
    }
    dragTarget = null; dragMode = null;
  });

  // ---------- toolbar ----------
  document.querySelectorAll('.tool-btn[data-tool]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tool-btn[data-tool]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      tool = btn.dataset.tool;
    });
  });
  const gravBtn = document.getElementById('gravityToggle');
  gravBtn.addEventListener('click', () => {
    gravityOn = !gravityOn;
    engine.gravity.y = gravityOn ? 0.55 : 0;
    gravBtn.textContent = `Gravity: ${gravityOn ? 'on' : 'off'}`;
    gravBtn.classList.toggle('active', gravityOn);
  });
  document.getElementById('clearLab').addEventListener('click', () => {
    Composite.clear(world, false);
    photonMeta.clear(); opticMeta.clear();
  });

  // ---------- optics: refraction across glass/prism boundaries ----------
  function nearestEdgeNormal(body, point) {
    const verts = body.vertices;
    let best = null, bestDist = Infinity;
    for (let i = 0; i < verts.length; i++) {
      const a = verts[i], b = verts[(i + 1) % verts.length];
      const ex = b.x - a.x, ey = b.y - a.y;
      const len = Math.hypot(ex, ey) || 1;
      const t = Math.max(0, Math.min(1, ((point.x - a.x) * ex + (point.y - a.y) * ey) / (len * len)));
      const px = a.x + ex * t, py = a.y + ey * t;
      const d = Math.hypot(point.x - px, point.y - py);
      if (d < bestDist) {
        bestDist = d;
        best = vNorm({ x: ey, y: -ex }); // perpendicular to edge
      }
    }
    // orient outward from centroid
    const c = body.position;
    const toPoint = vNorm({ x: point.x - c.x, y: point.y - c.y });
    if (best.x * toPoint.x + best.y * toPoint.y < 0) best = { x: -best.x, y: -best.y };
    return best;
  }

  function stepOptics() {
    const bodies = Composite.allBodies(world);
    const opticBodies = bodies.filter(b => opticMeta.has(b.id));

    photonMeta.forEach((meta, id) => {
      const body = bodies.find(b => b.id === id);
      if (!body) return;

      // trail
      meta.trail.push({ x: body.position.x, y: body.position.y });
      if (meta.trail.length > 22) meta.trail.shift();

      // find which optic (if any) currently contains the photon
      let containing = null;
      for (const ob of opticBodies) {
        const m = opticMeta.get(ob.id);
        if (m.type === 'mirror') continue;
        if (Matter.Vertices.contains(ob.vertices, body.position)) { containing = ob; break; }
      }

      const nowInside = !!containing;
      if (nowInside !== meta.inside) {
        const normal = containing
          ? nearestEdgeNormal(containing, body.position)
          : meta.lastOpticNormal;
        if (normal) {
          const dir = vNorm(body.velocity);
          const n1 = meta.inside ? GLASS_N : 1.0;
          const n2 = meta.inside ? 1.0 : GLASS_N;
          let outDir = vRefract(dir, normal, n1, n2);
          let tir = false;
          if (!outDir) { outDir = vReflect(dir, normal); tir = true; }
          const speed = Math.hypot(body.velocity.x, body.velocity.y);
          Body.setVelocity(body, vScale(outDir, speed));
          if (!tir) meta.inside = nowInside;
        } else {
          meta.inside = nowInside;
        }
      }
      if (containing) meta.lastOpticNormal = nearestEdgeNormal(containing, body.position);

      // bounds cull
      const W = canvas._cw, H = canvas._ch;
      if (body.position.x < -40 || body.position.x > W + 40 || body.position.y > H + 60) {
        World.remove(world, body);
        photonMeta.delete(id);
      }
    });
  }

  // ---------- mirror reflection (custom, since mirrors are thin static rects) ----------
  Matter.Events.on(engine, 'collisionStart', (evt) => {
    evt.pairs.forEach(pair => {
      const [a, b] = [pair.bodyA, pair.bodyB];
      const mirror = opticMeta.get(a.id)?.type === 'mirror' ? a : (opticMeta.get(b.id)?.type === 'mirror' ? b : null);
      const photon = photonMeta.has(a.id) ? a : (photonMeta.has(b.id) ? b : null);
      if (mirror && photon) {
        const normal = { x: Math.sin(mirror.angle), y: -Math.cos(mirror.angle) };
        const dir = vNorm(photon.velocity);
        const speed = Math.hypot(photon.velocity.x, photon.velocity.y);
        const reflected = vReflect(dir, normal);
        Body.setVelocity(photon, vScale(reflected, speed));
      }
    });
  });

  // ---------- render ----------
  function render() {
    const W = canvas._cw || 900, H = canvas._ch || 520;
    ctx.clearRect(0, 0, W, H);

    const bg = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.max(W, H) * 0.7);
    bg.addColorStop(0, '#0d1424'); bg.addColorStop(1, '#070a13');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

    const bodies = Composite.allBodies(world);

    bodies.forEach(b => {
      const m = opticMeta.get(b.id);
      if (!m) return;
      ctx.beginPath();
      b.vertices.forEach((v, i) => i === 0 ? ctx.moveTo(v.x, v.y) : ctx.lineTo(v.x, v.y));
      ctx.closePath();
      if (m.type === 'mirror') {
        ctx.fillStyle = 'rgba(230,240,255,0.85)';
        ctx.shadowColor = '#bfe0ff'; ctx.shadowBlur = 10;
        ctx.fill();
      } else {
        ctx.fillStyle = 'rgba(120,190,255,0.14)';
        ctx.strokeStyle = 'rgba(160,210,255,0.55)';
        ctx.lineWidth = 1.5;
        ctx.shadowBlur = 0;
        ctx.fill(); ctx.stroke();
      }
      ctx.shadowBlur = 0;
    });

    photonMeta.forEach((meta, id) => {
      const body = bodies.find(bb => bb.id === id);
      if (!body) return;
      const hue = meta.inside ? meta.hue + 40 : meta.hue;
      meta.trail.forEach((pt, i) => {
        const alpha = (i / meta.trail.length) * 0.5;
        ctx.beginPath();
        ctx.fillStyle = `hsla(${hue},95%,70%,${alpha})`;
        ctx.arc(pt.x, pt.y, 2.2, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.beginPath();
      ctx.fillStyle = `hsla(${hue},100%,80%,0.95)`;
      ctx.shadowColor = `hsla(${hue},100%,70%,0.9)`; ctx.shadowBlur = 14;
      ctx.arc(body.position.x, body.position.y, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    });

    if (aiming && aimStart && aimNow) {
      ctx.save();
      ctx.setLineDash([5, 5]);
      ctx.strokeStyle = 'rgba(255,255,255,0.5)';
      ctx.beginPath(); ctx.moveTo(aimStart.x, aimStart.y); ctx.lineTo(aimNow.x, aimNow.y); ctx.stroke();
      ctx.restore();
    }
  }

  // ---------- loop ----------
  let last = performance.now();
  function loop(now) {
    const dt = Math.min(now - last, 32); last = now;
    Engine.update(engine, dt);
    stepOptics();
    render();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  // seed the scene with a couple of demo objects
  setTimeout(() => {
    addGlass(canvas.clientWidth ? canvas.clientWidth * 0.55 : 500, 260);
    addMirror(150, 380);
  }, 50);
}
