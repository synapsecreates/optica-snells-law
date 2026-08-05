// physics.js — shared optics calculations used across the site
// All angles in degrees unless suffixed _rad

export const MEDIA = {
  vacuum:  { name: 'Vacuum',   n: 1.0000, color: '#1a2332' },
  air:     { name: 'Air',      n: 1.0003, color: '#2a3a52' },
  ice:     { name: 'Ice',      n: 1.309,  color: '#bfe8ff' },
  water:   { name: 'Water',    n: 1.333,  color: '#3fa8e0' },
  ethanol: { name: 'Ethanol',  n: 1.361,  color: '#e0d27a' },
  glass:   { name: 'Crown Glass', n: 1.520, color: '#9fd8ff' },
  quartz:  { name: 'Fused Quartz', n: 1.458, color: '#c9b8ff' },
  diamond: { name: 'Diamond',  n: 2.417,  color: '#e8fbff' },
};

// Rough dispersion offsets (illustrative, not spectrophotometrically exact)
// so red/green/blue light show slightly different n through dispersive media.
const DISPERSION = { red: -0.006, green: 0, blue: 0.010 };

export function dispersedIndex(baseN, wavelength) {
  if (baseN <= 1.0005) return baseN; // vacuum/air: negligible dispersion for our purposes
  return baseN + (DISPERSION[wavelength] ?? 0);
}

export const deg2rad = (d) => (d * Math.PI) / 180;
export const rad2deg = (r) => (r * 180) / Math.PI;

/**
 * Snell's Law: n1 sin(theta1) = n2 sin(theta2)
 * Returns { theta2Deg, tir, criticalAngleDeg }
 */
export function snell(n1, n2, theta1Deg) {
  const theta1 = deg2rad(theta1Deg);
  const sinTheta2 = (n1 / n2) * Math.sin(theta1);

  let criticalAngleDeg = null;
  if (n1 > n2) {
    criticalAngleDeg = rad2deg(Math.asin(n2 / n1));
  }

  if (Math.abs(sinTheta2) > 1) {
    return { theta2Deg: null, tir: true, criticalAngleDeg, sinTheta2 };
  }
  return { theta2Deg: rad2deg(Math.asin(sinTheta2)), tir: false, criticalAngleDeg, sinTheta2 };
}

export function speedInMedium(n) {
  const c = 299792.458; // km/s
  return c / n;
}

export function apparentDepth(realDepth, n1, n2) {
  // looking from medium n2 (e.g. air) down into medium n1 (e.g. water), near-normal approx
  return realDepth * (n2 / n1);
}

// Minimum deviation angle for a symmetric prism (thin educational approximation)
export function prismDeviation(n, apexAngleDeg, incidentAngleDeg) {
  const A = deg2rad(apexAngleDeg);
  const i1 = deg2rad(incidentAngleDeg);
  const sinR1 = Math.sin(i1) / n;
  if (Math.abs(sinR1) > 1) return null;
  const r1 = Math.asin(sinR1);
  const r2 = A - r1;
  const sinI2 = n * Math.sin(r2);
  if (Math.abs(sinI2) > 1) return null;
  const i2 = Math.asin(sinI2);
  const deviation = i1 + i2 - A;
  return rad2deg(deviation);
}

// ---- 2D vector helpers for the photon playground ----
export function vAdd(a, b) { return { x: a.x + b.x, y: a.y + b.y }; }
export function vScale(a, s) { return { x: a.x * s, y: a.y * s }; }
export function vDot(a, b) { return a.x * b.x + a.y * b.y; }
export function vNorm(a) { const m = Math.hypot(a.x, a.y) || 1; return { x: a.x / m, y: a.y / m }; }

/** Specular reflection of direction d off surface normal n (both unit vectors). */
export function vReflect(d, n) {
  const dn = vDot(d, n);
  return { x: d.x - 2 * dn * n.x, y: d.y - 2 * dn * n.y };
}

/**
 * Vector form of Snell's law. d = incident direction (unit), n = surface normal (unit,
 * pointing against the incident ray, i.e. into medium 1). Returns refracted unit vector,
 * or null if total internal reflection occurs (caller should then use vReflect).
 */
export function vRefract(d, n, n1, n2) {
  let normal = n;
  let cosI = -vDot(normal, d);
  if (cosI < 0) { // normal was pointing the "wrong" way, flip it
    normal = { x: -n.x, y: -n.y };
    cosI = -vDot(normal, d);
  }
  const eta = n1 / n2;
  const sin2t = eta * eta * (1 - cosI * cosI);
  if (sin2t > 1) return null; // TIR
  const cosT = Math.sqrt(1 - sin2t);
  const a = vScale(d, eta);
  const b = vScale(normal, eta * cosI - cosT);
  return vNorm(vAdd(a, b));
}

export function fmt(n, digits = 2) {
  if (n === null || n === undefined || Number.isNaN(n)) return '—';
  return n.toFixed(digits);
}
