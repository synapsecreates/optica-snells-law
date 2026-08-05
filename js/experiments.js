// experiments.js — guided virtual-lab experiments with notebook + export
import { MEDIA, snell, deg2rad, fmt } from './physics.js';

const EXPERIMENTS = [
  {
    title: 'Refractive Index of Glass',
    procedure: [
      'Set the incident medium to air and the target medium to crown glass.',
      'Sweep the incidence angle from 10° to 80° in steps of 10°.',
      'Record the refraction angle at each step.',
      'Plot sin θ₁ against sin θ₂ — the slope of the line is n₂.',
    ],
    n1: 'air', n2: 'glass', note: 'A straight-line sin-sin plot is the classic evidence that Snell\'s Law holds — any curvature would suggest a measurement error.',
  },
  {
    title: 'Finding the Critical Angle',
    procedure: [
      'Set the incident medium to crown glass and the target medium to air (light travelling from denser to rarer).',
      'Increase the incidence angle gradually.',
      'Note the exact angle at which the refracted ray grazes the boundary (θ₂ = 90°).',
      'Compare it to the predicted θc = sin⁻¹(n₂/n₁).',
    ],
    n1: 'glass', n2: 'air', note: 'Beyond this angle, no refracted ray exists at all — only reflection.',
  },
  {
    title: 'Total Internal Reflection',
    procedure: [
      'Keep glass → air, and push the incidence angle past the critical angle found above.',
      'Observe that the ray no longer crosses the boundary.',
      'Record the reflection angle and confirm it equals the incidence angle.',
    ],
    n1: 'glass', n2: 'air', note: 'This is the exact mechanism that keeps light trapped inside an optical fiber for its entire journey.',
  },
  {
    title: 'Red vs. Blue Light',
    procedure: [
      'Fix the incidence angle at 45° through a glass prism-like boundary.',
      'Compare the refraction angle for red light and blue light.',
      'Note which color bends more, and connect that to dispersion.',
    ],
    n1: 'air', n2: 'glass', note: 'Blue light has a slightly higher refractive index in glass than red — the reason prisms split white light into a spectrum.',
  },
];

export function initExperiments() {
  const tabs = document.querySelectorAll('.exp-tab');
  const panelsHost = document.getElementById('expPanels');
  if (!panelsHost) return;

  panelsHost.innerHTML = EXPERIMENTS.map((exp, i) => buildPanel(exp, i)).join('');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      document.querySelectorAll('.exp-panel').forEach(p => p.classList.remove('active'));
      document.getElementById('exp-panel-' + tab.dataset.exp).classList.add('active');
    });
  });

  EXPERIMENTS.forEach((exp, i) => wirePanel(exp, i));
}

function buildPanel(exp, i) {
  const rows = [10,20,30,40,50,60,70,80].map(a => `<tr data-angle="${a}"><td>${a}°</td><td class="obs-t2">—</td><td class="obs-check">—</td></tr>`).join('');
  return `
  <div class="exp-panel ${i === 0 ? 'active' : ''}" id="exp-panel-${i}">
    <div class="notebook panel">
      <h4>Experiment ${i+1} — ${exp.title}</h4>
      <ol>${exp.procedure.map(p => `<li>${p}</li>`).join('')}</ol>
      <table class="obs-table">
        <thead><tr><th>θ₁</th><th>θ₂ (measured)</th><th>Result</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <p style="color:var(--text-dim);font-size:12px;margin-bottom:16px;">${exp.note}</p>
      <button class="btn" data-export="${i}">Export observations (.csv)</button>
    </div>
    <div class="exp-canvas-wrap panel" style="padding:14px;">
      <canvas id="expCanvas-${i}"></canvas>
      <div class="slider-block" style="padding:0 8px;">
        <label><span>Incidence angle</span><span id="expAngleOut-${i}">45°</span></label>
        <input type="range" id="expAngle-${i}" min="0" max="89" value="45" />
      </div>
    </div>
  </div>`;
}

function wirePanel(exp, i) {
  const canvas = document.getElementById(`expCanvas-${i}`);
  const ctx = canvas.getContext('2d');
  const slider = document.getElementById(`expAngle-${i}`);
  const out = document.getElementById(`expAngleOut-${i}`);
  const n1 = MEDIA[exp.n1].n, n2 = MEDIA[exp.n2].n;

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = rect.width * dpr; canvas.height = rect.height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    canvas._cw = rect.width; canvas._ch = rect.height;
    draw();
  }

  function draw() {
    const W = canvas._cw || 400, H = canvas._ch || 380;
    const cx = W / 2, cy = H / 2;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(255,255,255,0.03)'; ctx.fillRect(0, 0, W, cy);
    ctx.fillStyle = 'rgba(87,230,255,0.06)'; ctx.fillRect(0, cy, W, H - cy);
    ctx.strokeStyle = 'rgba(238,243,251,0.2)'; ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(W, cy); ctx.stroke();
    ctx.save(); ctx.setLineDash([5,5]); ctx.strokeStyle = 'rgba(238,243,251,0.3)';
    ctx.beginPath(); ctx.moveTo(cx, cy - 140); ctx.lineTo(cx, cy + 140); ctx.stroke(); ctx.restore();

    const angle = +slider.value;
    const result = snell(n1, n2, angle);
    const rayLen = 170;
    const a1 = deg2rad(angle);
    const sx = cx - Math.sin(a1) * rayLen, sy = cy - Math.cos(a1) * rayLen;
    line(sx, sy, cx, cy, '#57e6ff');

    let tirNow = result.tir;
    if (!tirNow) {
      const a2 = deg2rad(result.theta2Deg);
      line(cx, cy, cx + Math.sin(a2) * rayLen, cy + Math.cos(a2) * rayLen, '#9b7bff');
    } else {
      line(cx, cy, cx + Math.sin(a1) * rayLen, cy - Math.cos(a1) * rayLen, '#ffb454');
    }

    function line(x1, y1, x2, y2, color) {
      ctx.save(); ctx.shadowColor = color; ctx.shadowBlur = 10;
      ctx.strokeStyle = color; ctx.lineWidth = 2.2;
      ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke(); ctx.restore();
    }

    // update matching row in table if angle is one of the sampled ones
    const row = document.querySelector(`#exp-panel-${i} tr[data-angle="${angle}"]`);
    document.querySelectorAll(`#exp-panel-${i} tr`).forEach(r => r.classList.remove('active-row'));
    if (row) {
      row.querySelector('.obs-t2').textContent = tirNow ? 'TIR' : fmt(result.theta2Deg, 1) + '°';
      row.querySelector('.obs-check').textContent = tirNow ? '⚠ TIR' : '✓';
    }
  }

  slider.addEventListener('input', () => { out.textContent = slider.value + '°'; draw(); });
  window.addEventListener('resize', resize);
  requestAnimationFrame(resize);

  const exportBtn = document.querySelector(`[data-export="${i}"]`);
  exportBtn.addEventListener('click', () => {
    const rows = [...document.querySelectorAll(`#exp-panel-${i} tbody tr`)].map(r => {
      const cells = r.querySelectorAll('td');
      return [cells[0].textContent, cells[1].textContent, cells[2].textContent].join(',');
    });
    const csv = ['theta1,theta2,result', ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `optica-experiment-${i+1}.csv`; a.click();
    URL.revokeObjectURL(url);
  });
}
