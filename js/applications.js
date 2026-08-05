// applications.js — real-world applications cards + detail modal
const APPS = [
  { icon: '🔬', title: 'Microscopes', short: 'Stacked lenses bend light to magnify the invisible.', detail: 'Compound microscopes use an objective and an eyepiece lens, each refracting light according to Snell\'s Law to build up magnification in stages. Precise control of refractive index and curvature is what separates a toy magnifier from a research-grade instrument able to resolve micrometer structures.' },
  { icon: '🔭', title: 'Telescopes', short: 'Refracting telescopes bend starlight to a focus.', detail: 'Refracting telescopes use an objective lens to bend incoming parallel starlight to a focal point. Chromatic aberration — different wavelengths refracting by slightly different amounts — is exactly the dispersion you can see in the simulator\'s wavelength selector, and is why achromatic lens doublets were such a breakthrough.' },
  { icon: '📷', title: 'Camera lenses', short: 'Multi-element glass stacks correct for real-world light.', detail: 'A modern camera lens is a stack of eight or more glass elements, each engineered with a specific refractive index and curvature, working together to bend light from a scene onto a flat sensor while cancelling out distortion and chromatic aberration.' },
  { icon: '🧵', title: 'Optical fibers', short: 'Total internal reflection carries light for thousands of kilometers.', detail: 'Fiber-optic cable is essentially a glass thread thinner than a hair, with a core of slightly higher refractive index than its cladding. Light entering within the fiber\'s acceptance cone strikes the core-cladding boundary beyond the critical angle every time, so it undergoes total internal reflection continuously and never leaks out.' },
  { icon: '🌐', title: 'Fiber-optic internet', short: 'The same TIR principle, at planetary scale.', detail: 'Undersea cables spanning oceans rely on the same total-internal-reflection physics as a lab demonstration, scaled to carry pulses of laser light thousands of kilometers with minimal loss — the backbone of the modern internet.' },
  { icon: '👓', title: 'Eyeglasses', short: 'Corrective lenses refract light to meet the retina in focus.', detail: 'A prescription lens bends incoming light by a precisely calculated amount so that it converges exactly on the retina instead of in front of or behind it, correcting for the eye\'s own imperfect focusing.' },
  { icon: '💎', title: 'Diamonds', short: 'A very high refractive index traps light inside the stone.', detail: 'Diamond\'s refractive index of about 2.417 gives it an unusually small critical angle. Cutters exploit this: light entering the top undergoes total internal reflection off the lower facets before exiting toward the viewer, producing the stone\'s signature brilliance.' },
  { icon: '🏭', title: 'Glass manufacturing', short: 'Composition is tuned to hit a target refractive index.', detail: 'Glassmakers adjust composition — adding lead oxide for crystal, or specific dopants for optical fiber cores — specifically to tune the refractive index for a target application, from eyeglasses to camera lenses to fiber cores.' },
  { icon: '🩺', title: 'Endoscopy', short: 'Fiber bundles pipe images out of the body via TIR.', detail: 'Medical endoscopes use bundles of optical fibers — one set piping light in, another piping an image back out — relying on the same total-internal-reflection guiding principle as telecom fiber, just miniaturized and flexible enough to travel through the body.' },
  { icon: '🔍', title: 'Lenses, generally', short: 'Every convex and concave lens is Snell\'s Law in glass.', detail: 'Every lens shape — convex, concave, meniscus — is simply a surface engineered so that Snell\'s Law, applied across its curvature, redirects a bundle of light rays to converge or diverge exactly as intended.' },
];

export function initApplications() {
  const grid = document.getElementById('appGrid');
  const modal = document.getElementById('appDetail');
  const body = document.getElementById('appDetailBody');
  const closeBtn = document.getElementById('appDetailClose');
  if (!grid) return;

  grid.innerHTML = APPS.map((a, i) => `
    <div class="app-card panel reveal" data-i="${i}">
      <span class="icon">${a.icon}</span>
      <h3>${a.title}</h3>
      <p>${a.short}</p>
    </div>
  `).join('');

  grid.querySelectorAll('.app-card').forEach(card => {
    card.addEventListener('click', () => {
      const a = APPS[+card.dataset.i];
      body.innerHTML = `
        <div style="font-size:34px;margin-bottom:14px;">${a.icon}</div>
        <h3 style="font-size:22px;margin-bottom:14px;">${a.title}</h3>
        <p style="font-size:14.5px;color:var(--text-mid);line-height:1.7;">${a.detail}</p>
        <div style="margin-top:22px;padding-top:18px;border-top:1px solid var(--line);font-size:12px;color:var(--text-dim);">Why Snell's Law matters here: the exact bend angle at every optical surface determines whether the device works at all.</div>
      `;
      modal.classList.add('show');
    });
  });
  closeBtn.addEventListener('click', () => modal.classList.remove('show'));
  modal.addEventListener('click', (e) => { if (e.target === modal) modal.classList.remove('show'); });
}
