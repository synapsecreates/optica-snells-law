// quiz.js — polished assessment: MCQ + numeric, scoring, report card
import { MEDIA, snell, fmt } from './physics.js';

const QUESTIONS = [
  { cat: 'concept', q: 'When light passes from air into water, it bends…', options: ['Away from the normal', 'Toward the normal', 'Parallel to the normal', 'It does not bend'], correct: 1, explain: 'Water has a higher refractive index than air, so light slows down and bends toward the normal.' },
  { cat: 'concept', q: 'Snell\'s Law is written as…', options: ['n₁ + θ₁ = n₂ + θ₂', 'n₁ sin θ₁ = n₂ sin θ₂', 'n₁ cos θ₁ = n₂ cos θ₂', 'n₁ / θ₁ = n₂ / θ₂'], correct: 1, explain: 'Snell\'s Law relates the refractive indices and the sines of the angles measured from the normal.' },
  { cat: 'math', q: 'Light hits a glass surface (n = 1.5) from air at 30°. What is sin θ₂ (to 2 d.p.)?', options: ['0.33', '0.50', '0.75', '1.00'], correct: 0, explain: 'sin θ₂ = (n₁/n₂) sin θ₁ = (1/1.5) × 0.5 = 0.33.' },
  { cat: 'concept', q: 'Total internal reflection can only occur when light travels…', options: ['From a lower to a higher index medium', 'From a higher to a lower index medium', 'Between two identical media', 'Only in a vacuum'], correct: 1, explain: 'TIR requires going from denser (higher n) to rarer (lower n) media, and only beyond the critical angle.' },
  { cat: 'reasoning', q: 'Why does a straw in a glass of water appear bent at the surface?', options: ['The water absorbs part of the straw', 'Light from the submerged part refracts before reaching your eye', 'The glass distorts your vision', 'It is an optical illusion with no physical cause'], correct: 1, explain: 'Light rays from the submerged section bend at the water\'s surface, shifting the apparent position of that part of the straw.' },
  { cat: 'math', q: 'The critical angle for glass (n = 1.5) to air is closest to…', options: ['24°', '42°', '61°', '90°'], correct: 1, explain: 'θc = sin⁻¹(1/1.5) = sin⁻¹(0.667) ≈ 41.8°.' },
  { cat: 'concept', q: 'A material with a higher refractive index has light travelling through it…', options: ['Faster', 'Slower', 'At the same speed as vacuum', 'Refractive index does not affect speed'], correct: 1, explain: 'Speed in a medium = c / n, so higher n means slower light.' },
  { cat: 'reasoning', q: 'Diamonds sparkle brilliantly mainly because of…', options: ['Their hardness', 'A very high refractive index causing extensive total internal reflection', 'Their color', 'Static electricity'], correct: 1, explain: 'Diamond\'s high n (≈2.42) gives it a small critical angle, so light bounces internally many times before escaping, producing brilliance.' },
  { cat: 'math', q: 'If n₁ sin θ₁ = n₂ sin θ₂ and n₁ = n₂, then θ₁ must equal…', options: ['0°', '90°', 'θ₂', 'It is undefined'], correct: 2, explain: 'If the two refractive indices are equal, the equation reduces to sin θ₁ = sin θ₂, so θ₁ = θ₂ — no bending at all.' },
  { cat: 'reasoning', q: 'Optical fibers keep light trapped inside primarily through…', options: ['Mirrors coated on the outside', 'Total internal reflection at the core-cladding boundary', 'Absorbing and re-emitting light', 'Magnetic fields'], correct: 1, explain: 'The fiber core has a higher refractive index than its cladding, so light hitting the boundary beyond the critical angle reflects internally the entire length of the fiber.' },
];

export function initQuiz() {
  const body = document.getElementById('quizBody');
  const bar = document.getElementById('quizBar');
  const scoreLabel = document.getElementById('quizScoreLabel');
  const nextBtn = document.getElementById('quizNext');
  if (!body) return;

  let idx = 0;
  let answered = false;
  const results = []; // { cat, correct }

  function renderQuestion() {
    const item = QUESTIONS[idx];
    answered = false;
    bar.style.width = ((idx) / QUESTIONS.length * 100) + '%';
    scoreLabel.textContent = `Question ${idx + 1} of ${QUESTIONS.length}`;
    nextBtn.textContent = 'Check answer';

    body.innerHTML = `
      <div class="quiz-q">${item.q}</div>
      <div class="quiz-options">
        ${item.options.map((o, i) => `<button class="quiz-opt" data-i="${i}">${o}</button>`).join('')}
      </div>
      <div class="quiz-explain" id="quizExplain">${item.explain}</div>
    `;

    body.querySelectorAll('.quiz-opt').forEach(btn => {
      btn.addEventListener('click', () => {
        if (answered) return;
        answered = true;
        const chosen = +btn.dataset.i;
        const isCorrect = chosen === item.correct;
        body.querySelectorAll('.quiz-opt').forEach((b, i) => {
          if (i === item.correct) b.classList.add('correct');
          else if (i === chosen) b.classList.add('wrong');
        });
        document.getElementById('quizExplain').classList.add('show');
        results.push({ cat: item.cat, correct: isCorrect });
        nextBtn.textContent = idx < QUESTIONS.length - 1 ? 'Next question' : 'See report card';
      });
    });
  }

  function renderReport() {
    bar.style.width = '100%';
    const total = results.length;
    const correctCount = results.filter(r => r.correct).length;
    const pct = Math.round((correctCount / total) * 100);

    const byCat = {};
    results.forEach(r => {
      byCat[r.cat] = byCat[r.cat] || { c: 0, t: 0 };
      byCat[r.cat].t++; if (r.correct) byCat[r.cat].c++;
    });
    const catLabel = { concept: 'Understanding of refraction', math: 'Mathematical accuracy', reasoning: 'Conceptual reasoning' };

    const weakest = Object.entries(byCat).sort((a, b) => (a[1].c / a[1].t) - (b[1].c / b[1].t))[0];
    const recommendations = {
      concept: 'Revisit the "What is Refraction?" section for the core intuition.',
      math: 'Spend more time in the Simulator adjusting angles and media to build number sense.',
      reasoning: 'Work through the Challenge & Analysis problems at Intermediate level.',
    };

    scoreLabel.textContent = `Final score: ${correctCount}/${total}`;
    nextBtn.textContent = 'Restart quiz';

    body.innerHTML = `
      <div class="quiz-report">
        <h3 style="font-size:38px;margin-bottom:6px;">${pct}%</h3>
        <p style="color:var(--text-dim);font-size:14px;margin-bottom:8px;">${correctCount} of ${total} correct</p>
        <div class="report-metrics">
          ${Object.entries(byCat).map(([cat, v]) => `
            <div class="report-metric">
              <div class="label">${catLabel[cat] || cat}</div>
              <div class="bar-track"><div class="bar-fill" style="width:${Math.round(v.c/v.t*100)}%"></div></div>
            </div>
          `).join('')}
        </div>
        <p style="font-size:13px;color:var(--text-dim);">Recommended next topic: <span style="color:var(--cyan)">${recommendations[weakest?.[0]] || 'Review the Mathematics section.'}</span></p>
      </div>
    `;
  }

  nextBtn.addEventListener('click', () => {
    if (idx >= QUESTIONS.length) { // restart
      idx = 0; results.length = 0; renderQuestion(); return;
    }
    if (!answered) {
      // treat as "skip"/no selection made — mark wrong and reveal
      answered = true;
      const item = QUESTIONS[idx];
      document.querySelectorAll('.quiz-opt')[item.correct]?.classList.add('correct');
      document.getElementById('quizExplain')?.classList.add('show');
      results.push({ cat: item.cat, correct: false });
      nextBtn.textContent = idx < QUESTIONS.length - 1 ? 'Next question' : 'See report card';
      return;
    }
    idx++;
    if (idx >= QUESTIONS.length) renderReport();
    else renderQuestion();
  });

  renderQuestion();
}
