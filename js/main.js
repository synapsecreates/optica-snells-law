// main.js — boots the whole Optica experience
import { initSignatureRay } from './signature-ray.js';
import { initHeroScene } from './hero3d.js';
import { initRefractionDemo } from './refraction.js';
import { initSimulator } from './simulator.js';
import { initPhotonLab } from './photonlab.js';
import { initMath } from './math.js';
import { initApplications } from './applications.js';
import { initTimeline } from './timeline.js';
import { initExperiments } from './experiments.js';
import { initChallenge } from './challenge.js';
import { initQuiz } from './quiz.js';

// ---------- Lenis smooth scroll + GSAP ScrollTrigger sync ----------
let lenis;
function initSmoothScroll() {
  if (typeof Lenis === 'undefined') return;
  lenis = new Lenis({ duration: 1.05, smoothWheel: true, wheelMultiplier: 1 });

  if (window.gsap && window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  } else {
    function raf(time) { lenis.raf(time); requestAnimationFrame(raf); }
    requestAnimationFrame(raf);
  }
}

// ---------- floating nav: smooth anchor scroll + scrollspy ----------
function initNav() {
  const links = document.querySelectorAll('.nav__links a[data-nav]');
  links.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const target = document.querySelector(link.getAttribute('href'));
      if (!target) return;
      if (lenis) lenis.scrollTo(target, { offset: -20, duration: 1.2 });
      else target.scrollIntoView({ behavior: 'smooth' });
    });
  });

  const sections = Array.from(document.querySelectorAll('main > section[id]'));
  const map = new Map(Array.from(links).map(l => [l.getAttribute('href').slice(1), l]));
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const link = map.get(entry.target.id);
      if (!link) return;
      if (entry.isIntersecting) {
        links.forEach(l => l.classList.remove('active'));
        link.classList.add('active');
      }
    });
  }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });
  sections.forEach(s => io.observe(s));
}

// ---------- hero entrance animation ----------
function initHeroAnimation() {
  if (!window.gsap) return;
  // split .word spans already exist per-line; animate them up
  const words = document.querySelectorAll('.hero__title .word');
  const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });
  tl.set(words, { yPercent: 130 })
    .set('.hero__sub, .hero__ctas, .hero__stats, .hero__eyebrow', { opacity: 0, y: 16 })
    .to('.hero__eyebrow', { opacity: 1, y: 0, duration: 0.6 }, 0.1)
    .to(words, { yPercent: 0, duration: 1.1, stagger: 0.09 }, 0.15)
    .to('.hero__sub', { opacity: 1, y: 0, duration: 0.8 }, 0.55)
    .to('.hero__ctas', { opacity: 1, y: 0, duration: 0.8 }, 0.68)
    .to('.hero__stats', { opacity: 1, y: 0, duration: 0.8 }, 0.8)
    .from('.hero__scene', { opacity: 0, x: 40, duration: 1.1, ease: 'power3.out' }, 0.3);
}

// ---------- generic scroll reveals ----------
function initReveals() {
  if (!window.gsap || !window.ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger);

  const targets = document.querySelectorAll(
    '.section-eyebrow, .section-title, .section-lede, .sim-controls, .sim-stage, .lab-stage, .lab-side, .math-card, .notebook, .exp-canvas-wrap, .challenge-panel, .quiz-shell, .app-card, .stat-card, .refract-demo canvas'
  );
  targets.forEach((el, i) => {
    gsap.fromTo(el, { opacity: 0, y: 26 }, {
      opacity: 1, y: 0, duration: 0.8, ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 88%' },
    });
  });
}

// ---------- boot ----------
// Each module is booted independently: if one section has a bug, it logs a clear
// error but every other section still initializes instead of the whole page going dark.
function safeInit(name, fn) {
  try { fn(); } catch (err) { console.error(`[Optica] "${name}" failed to initialize:`, err); }
}

document.addEventListener('DOMContentLoaded', () => {
  safeInit('smooth scroll', initSmoothScroll);
  safeInit('nav', initNav);
  safeInit('signature ray', initSignatureRay);
  safeInit('hero 3D scene', initHeroScene);
  safeInit('hero animation', initHeroAnimation);
  safeInit('refraction demo', initRefractionDemo);
  safeInit('simulator', initSimulator);
  safeInit('photon lab', initPhotonLab);
  safeInit('math', initMath);
  safeInit('applications', initApplications);
  safeInit('timeline', initTimeline);
  safeInit('experiments', initExperiments);
  safeInit('challenge', initChallenge);
  safeInit('quiz', initQuiz);
  // reveals after content is in the DOM (applications/experiments build cards dynamically)
  requestAnimationFrame(() => {
    safeInit('reveals', initReveals);
    if (window.ScrollTrigger) ScrollTrigger.refresh();
  });
});
