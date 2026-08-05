// timeline.js — cinematic horizontal-scroll history of optics
const EVENTS = [
  { year: '~700 BCE', title: 'Ancient lenses', text: 'Polished rock-crystal lenses, like the Nimrud lens, show early civilizations were already shaping transparent material to bend light — long before anyone could explain why it worked.' },
  { year: '984 CE', title: 'Ibn Sahl', text: 'The mathematician Ibn Sahl describes a law relating the angles of incident and refracted rays for lenses and mirrors — the earliest known correct statement of what we now call Snell\'s Law.' },
  { year: '1021', title: 'Alhazen (Ibn al-Haytham)', text: 'His Book of Optics establishes light as something that travels and can be studied experimentally, laying groundwork for a scientific approach to vision and refraction.' },
  { year: '1621', title: 'Willebrord Snellius', text: 'The Dutch astronomer derives the mathematical law of refraction, relating the sines of the incident and refracted angles — the relationship that carries his name today.' },
  { year: '1637', title: 'René Descartes', text: 'Descartes publishes the law independently in La Dioptrique, which is why continental Europe often calls it "Descartes\' Law" rather than Snell\'s Law.' },
  { year: '1666–1704', title: 'Isaac Newton', text: 'Newton\'s prism experiments show that white light is a mixture of colors, each refracting by a slightly different amount — the dispersion visible in every rainbow and every glass prism.' },
  { year: '1801', title: 'Thomas Young', text: 'Young\'s double-slit experiment demonstrates the wave nature of light, giving refraction a deeper physical explanation rooted in changing wave speed.' },
  { year: '1865', title: 'James Clerk Maxwell', text: 'Maxwell\'s equations unify light with electromagnetism, explaining refractive index in terms of a material\'s electric and magnetic response to a passing wave.' },
  { year: '1970s–today', title: 'Modern photonics', text: 'Low-loss optical fiber, laser diodes and precision-ground lens systems turn Snell\'s four-century-old law into the infrastructure of global communication and medicine.' },
];

export function initTimeline() {
  const track = document.getElementById('timelineTrack');
  if (!track) return;

  track.innerHTML = EVENTS.map(e => `
    <div class="timeline-item panel">
      <div class="year">${e.year}</div>
      <h3>${e.title}</h3>
      <p>${e.text}</p>
    </div>
  `).join('');

  if (!window.gsap || !window.ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger);

  const wrap = document.querySelector('.timeline-track-wrap');
  const bar = document.getElementById('timelineBar');

  function build() {
    const scrollDist = Math.max(track.scrollWidth - wrap.clientWidth, 0);
    ScrollTrigger.getById('timelinePin')?.kill();
    gsap.to(track, {
      x: -scrollDist,
      ease: 'none',
      scrollTrigger: {
        id: 'timelinePin',
        trigger: '#history',
        start: 'top top',
        end: () => '+=' + (scrollDist + window.innerHeight * 0.4),
        scrub: 0.6,
        pin: true,
        anticipatePin: 1,
        onUpdate: (self) => { bar.style.width = (self.progress * 100) + '%'; },
      }
    });
  }

  build();
  window.addEventListener('resize', () => ScrollTrigger.refresh());
}
