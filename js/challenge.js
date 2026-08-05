// challenge.js — solvable physics problems, checked instantly, with full solutions
import { MEDIA, snell, rad2deg, fmt } from './physics.js';

const MEDIUM_NAMES = Object.entries(MEDIA).filter(([k]) => k !== 'vacuum');

function rand(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randInt(a, b) { return Math.floor(a + Math.random() * (b - a)); }

function generate(difficulty) {
  if (difficulty === 'beginner') {
    const [k1, m1] = rand(MEDIUM_NAMES);
    const [k2, m2] = rand(MEDIUM_NAMES.filter(([k]) => k !== k1));
    const theta1 = randInt(15, 60);
    const result = snell(m1.n, m2.n, theta1);
    return {
      text: `Light travels from ${m1.name} (n = ${fmt(m1.n,3)}) into ${m2.name} (n = ${fmt(m2.n,3)}) at an angle of incidence of ${theta1}°. What is the angle of refraction, in degrees?`,
      answer: result.tir ? null : result.theta2Deg,
      tolerance: 0.5,
      steps: [
        `Write Snell's Law: n₁ sin θ₁ = n₂ sin θ₂.`,
        `Substitute known values: ${fmt(m1.n,3)} × sin(${theta1}°) = ${fmt(m2.n,3)} × sin θ₂.`,
        `sin θ₂ = (${fmt(m1.n,3)} / ${fmt(m2.n,3)}) × sin(${theta1}°) = ${fmt(result.sinTheta2,4)}.`,
        result.tir ? `Since this exceeds 1, no real solution exists — the ray undergoes total internal reflection instead.` : `θ₂ = sin⁻¹(${fmt(result.sinTheta2,4)}) = ${fmt(result.theta2Deg,1)}°.`
      ],
    };
  }
  if (difficulty === 'intermediate') {
    const [k1, m1] = rand(MEDIUM_NAMES);
    const theta1 = randInt(20, 70);
    const theta2 = randInt(Math.max(5, theta1 - 25), theta1 + 5);
    const n2 = (m1.n * Math.sin(theta1 * Math.PI/180)) / Math.sin(theta2 * Math.PI/180);
    return {
      text: `A ray enters a second medium from ${m1.name} (n₁ = ${fmt(m1.n,3)}). The angle of incidence is ${theta1}° and the measured angle of refraction is ${theta2}°. What is the refractive index n₂ of the second medium?`,
      answer: n2,
      tolerance: 0.03,
      steps: [
        `Rearrange Snell's Law for n₂: n₂ = n₁ sin θ₁ / sin θ₂.`,
        `n₂ = ${fmt(m1.n,3)} × sin(${theta1}°) / sin(${theta2}°).`,
        `n₂ = ${fmt(m1.n,3)} × ${fmt(Math.sin(theta1*Math.PI/180),4)} / ${fmt(Math.sin(theta2*Math.PI/180),4)}.`,
        `n₂ ≈ ${fmt(n2,3)}.`
      ],
    };
  }
  // advanced
  const [k1, m1] = rand(MEDIUM_NAMES.filter(([k]) => MEDIA[k].n > 1.2));
  const [k2, m2] = rand(MEDIUM_NAMES.filter(([k]) => MEDIA[k].n < m1.n));
  const critical = rad2deg(Math.asin(m2.n / m1.n));
  return {
    text: `Light travels from ${m1.name} (n₁ = ${fmt(m1.n,3)}) toward ${m2.name} (n₂ = ${fmt(m2.n,3)}). What is the critical angle, in degrees, beyond which total internal reflection occurs?`,
    answer: critical,
    tolerance: 0.5,
    steps: [
      `Total internal reflection requires going from higher to lower refractive index — true here since ${fmt(m1.n,3)} > ${fmt(m2.n,3)}.`,
      `At the critical angle, θ₂ = 90°, so Snell's Law becomes n₁ sin θc = n₂ sin(90°) = n₂.`,
      `θc = sin⁻¹(n₂ / n₁) = sin⁻¹(${fmt(m2.n,3)} / ${fmt(m1.n,3)}) = sin⁻¹(${fmt(m2.n/m1.n,4)}).`,
      `θc ≈ ${fmt(critical,1)}°.`
    ],
  };
}

export function initChallenge() {
  const diffBtns = document.querySelectorAll('#challengeDiff [data-diff]');
  const problemText = document.getElementById('problemText');
  const answerInput = document.getElementById('problemAnswer');
  const checkBtn = document.getElementById('problemCheck');
  const nextBtn = document.getElementById('problemNext');
  const feedback = document.getElementById('problemFeedback');
  const revealBtn = document.getElementById('problemReveal');
  const stepsHost = document.getElementById('solutionSteps');
  if (!problemText) return;

  let difficulty = 'beginner';
  let current = generate(difficulty);
  render();

  function render() {
    problemText.textContent = current.text;
    answerInput.value = '';
    feedback.classList.remove('show', 'correct', 'wrong');
    stepsHost.classList.remove('show');
    stepsHost.innerHTML = current.steps.map((s, i) => `<div class="derivation-step"><div class="n">${String(i+1).padStart(2,'0')}</div><div class="t">${s}</div></div>`).join('');
  }

  diffBtns.forEach(btn => btn.addEventListener('click', () => {
    diffBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    difficulty = btn.dataset.diff;
    current = generate(difficulty);
    render();
  }));

  nextBtn.addEventListener('click', () => { current = generate(difficulty); render(); });

  checkBtn.addEventListener('click', () => {
    const val = parseFloat(answerInput.value);
    feedback.classList.add('show');
    if (current.answer === null) {
      const isTirWord = /tir|total|no refraction|reflect/i.test(answerInput.value);
      feedback.classList.toggle('correct', isTirWord);
      feedback.classList.toggle('wrong', !isTirWord);
      feedback.textContent = isTirWord ? 'Correct — total internal reflection occurs, so there is no refracted ray.' : 'Not quite — check whether sin θ₂ exceeds 1. If it does, the answer is total internal reflection, not a numeric angle.';
      return;
    }
    if (Number.isNaN(val)) {
      feedback.classList.add('wrong'); feedback.classList.remove('correct');
      feedback.textContent = 'Enter a numeric answer first.';
      return;
    }
    const ok = Math.abs(val - current.answer) <= current.tolerance;
    feedback.classList.toggle('correct', ok);
    feedback.classList.toggle('wrong', !ok);
    feedback.textContent = ok
      ? `Correct — ${fmt(current.answer,2)} (±${current.tolerance}).`
      : `Not quite. Common mistake: mixing up which medium is n₁ vs n₂, or using cos instead of sin. The correct answer is ${fmt(current.answer,2)}.`;
  });

  revealBtn.addEventListener('click', () => stepsHost.classList.toggle('show'));
}
