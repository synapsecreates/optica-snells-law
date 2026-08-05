# Optica — Setup Guide

Optica is a static, no-build-step website. There is no `npm install` and no bundler —
every library (Three.js, GSAP, Matter.js, Lenis) loads from a CDN in the browser, and
all app code is plain ES modules.

## 1. Folder structure

```
optica/
├── index.html          ← everything is one page, sectioned by <section id="...">
├── SETUP.md             ← this file
├── css/
│   └── main.css         ← design tokens, layout, every component style
└── js/
    ├── physics.js        ← Snell's Law math, refractive indices, vector optics (shared)
    ├── signature-ray.js   ← the persistent bending light-ray background element
    ├── hero3d.js           ← Three.js glass prism scene in the hero
    ├── refraction.js        ← "What is refraction?" drag-to-bend demo
    ├── simulator.js          ← the main Snell's Law simulator
    ├── photonlab.js           ← Matter.js "Photon Playground"
    ├── math.js                 ← derivation + critical-angle graph
    ├── applications.js          ← real-world application cards
    ├── timeline.js                ← GSAP ScrollTrigger horizontal history
    ├── experiments.js              ← guided virtual-lab notebook (4 experiments)
    ├── challenge.js                 ← generated problems + worked solutions
    ├── quiz.js                       ← 10-question assessment + report card
    └── main.js                       ← boots everything: Lenis, nav, reveals, hero animation
```

## 2. Running it locally

Because the page uses ES module `<script type="module">` imports, opening
`index.html` directly with `file://` will be blocked by the browser's CORS rules.
You need a tiny local web server. Any of these work — pick whichever you have:

**Python (built into macOS/Linux, and on Windows via python.org):**
```bash
cd optica
python3 -m http.server 8080
```
Then open **http://localhost:8080**

**Node.js:**
```bash
cd optica
npx serve .
```

**VS Code:**
Install the "Live Server" extension, right-click `index.html`, choose
**"Open with Live Server"**.

No build step, no `package.json`, no install required — the server is only there
to satisfy the browser's module-loading rules.

## 3. Deploying it

Optica is 100% static, so it deploys anywhere that serves plain files:

- **Netlify / Vercel**: drag-and-drop the `optica` folder, or connect a Git repo — no
  build command needed (leave the build command empty, publish directory = `optica`).
- **GitHub Pages**: push the folder to a repo and enable Pages on the branch/folder.
- **Any static host / S3 bucket / nginx**: just copy the files up.

## 4. Requirements & browser support

- A modern browser with WebGL2 (for the Three.js prism) — current Chrome, Firefox,
  Safari, or Edge all work.
- **No CDN dependency.** GSAP, ScrollTrigger, Matter.js, Lenis, and Three.js
  (including `OrbitControls`) are vendored locally under `js/vendor/`, so the site
  works fully offline once you have the files — nothing fails just because a CDN is
  blocked, ad-blocked, or unreachable. The only external network call is the Google
  Fonts stylesheet in `<head>`; if that's blocked, the page still works and simply
  falls back to system fonts.
- Works on mobile, but the Photon Playground and Simulator are easiest to use with a
  mouse; touch drag is supported but fiddly on very small screens.

## Troubleshooting: "nothing appears in the interactive sections"

If canvases stay blank, open the browser console (F12) first — the most likely causes:

- **Opened via `file://` instead of a local server.** ES modules are blocked by CORS
  under `file://`; see step 2 above.
- **A JS error part-way through boot.** `js/main.js` boots each section in its own
  try/catch (`safeInit`), so one broken section logs a clear `[Optica] "..." failed
  to initialize:` message in the console instead of taking the whole page down —
  check the console for that prefix to see exactly which section failed and why.

## 5. Design & architecture notes

- **No Barba.js page routing.** The brief asked for Barba.js transitions between
  "pages," but Barba fetches other HTML documents over `fetch()`, which breaks under
  `file://` and adds real complexity for a single-audience learning tool. Instead,
  Optica is one continuous page with ten `<section>`s, smooth-scrolled with **Lenis**
  and revealed with **GSAP ScrollTrigger** — you get the same cinematic, connected
  feel without a routing layer to maintain. If you later split sections into real
  separate pages, Barba can be layered on top of this same structure.
- **The signature element** is the thin light-ray thread that runs down the right
  edge of the whole page (`js/signature-ray.js`) and visibly kinks every time you
  scroll past a section boundary — a literal, ambient expression of the site's own
  subject.
- **Matter.js in the Photon Playground** handles placement, dragging, and mirror
  collisions; refraction across glass/prism boundaries is computed with the vector
  form of Snell's Law in `physics.js` (`vRefract` / `vReflect`), since Matter's
  built-in solver has no concept of optical refraction.
- **Physics accuracy**: all refractive indices (air, water, ice, ethanol, crown
  glass, fused quartz, diamond) and every angle calculation route through the single
  `physics.js` module, so the simulator, experiments, challenge generator, and quiz
  can never disagree with each other.

## 6. Extending it

- Add a medium: edit the `MEDIA` object in `js/physics.js` — every section that
  reads from it (simulator, experiments, challenge generator) picks it up
  automatically.
- Add a quiz question: append an object to the `QUESTIONS` array in `js/quiz.js`
  with a `cat` of `concept`, `math`, or `reasoning` so it feeds the report card.
- Add a timeline event or application card: extend the `EVENTS` array in
  `js/timeline.js` or the `APPS` array in `js/applications.js`.
