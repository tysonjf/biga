// Commercial yeast for a direct dough, from Craig's (TXCraig1, pizzamaking.com) yeast chart, with
// the dough's real temperature over time. Ported from the weatherApp engine (tysonjf/weatherapp,
// src/engine/fermentation.ts and thermal.ts), so both apps agree.
//
// Craig's chart gives the hours for a dough to reach its end point (about doubled) at a constant
// temperature, for each fresh-yeast %. It's separable to within rounding:
//
//     H(Y, T) = H1(T) · Y^(−B)        Y = fresh yeast % of flour
//
// so temperature only changes the speed, and any schedule (room, fridge, back out) collapses to
// "equivalent hours at 21 °C". ln H1 is a quartic in °C (≈ 2 % error) across 1.7–35 °C. A 4 °C
// fridge runs at ~8 % of 21 °C, the Italian rule of thumb "1 h in the fridge ≈ 0.1 h out".

export const REF_C = 21

/** Yeast exponent: H ∝ Y^(−B). */
export const B = 0.728397214164927
const P4 = [6.447582544737171e-6, -0.0004479630187699247, 0.011273610666424403, -0.2613392358382555, 4.663467910392636];
const T_LO = 1.667;
const T_HI = 35;
const SLOPE_LO = -0.22737; // d lnH1/dT at the cold end of the chart

const poly = (t: number) => P4.reduce((acc, c) => acc * t + c, 0);

/** ln H1(T): hours for 1 % fresh yeast to reach Craig's end point at T (°C). */
function lnH1(tC: number): number {
  if (tC < T_LO) return poly(T_LO) + SLOPE_LO * (tC - T_LO);
  if (tC > T_HI) {
    // Yeast is stressed above ~35 °C and dies off towards ~45–50 °C.
    const decline = Math.max(0.02, (45 - tC) / 10);
    return poly(T_HI) - Math.log(decline);
  }
  return poly(tC);
}

const LN_REF = lnH1(REF_C);
/** Hours for 1 % fresh yeast at 21 °C (≈ 3.5 h). */
export const H1_REF = Math.exp(LN_REF);

/** Yeast speed at tC relative to 21 °C. */
export const rateAt = (tC: number) => Math.exp(LN_REF - lnH1(tC));

/** Fresh yeast % that reaches the end point in `eqH` equivalent hours at 21 °C. */
export const freshForEqHours = (eqH: number) => Math.pow(H1_REF / eqH, 1 / B);

/** Instant dry yeast weighs a third of fresh for the same work (Craig: IDY × 3 = CY). */
export const IDY_PER_FRESH = 1 / 3;

/* ---------- dough composition ---------- */

// Relative yeast need from the Italian Calcolapizza ("Japi") formula: salt and fat slow the yeast,
// water speeds it up to about 69 %. Craig's chart is for Neapolitan-style dough (~63 %, ~2.8 % salt).
type Composition = { hyd: number; salt: number; oil: number; sugar: number };

function japiTerm(f: Composition): number {
  const I = Math.min(68.9, Math.max(40, f.hyd));
  const perLitre = 1000 / Math.max(1, f.hyd);
  const S = f.salt * perLitre;
  const G = f.oil * perLitre;
  const hyd = 4.2 * I - 80 - 0.0305 * I * I;
  // A lot of sugar slows yeast osmotically (≈ +4 % yeast per % above 5 %).
  const sugar = 1 + Math.max(0, f.sugar - 5) * 0.04;
  return ((1 + S / 200) * (1 + G / 300) * sugar) / hyd;
}

const REF_TERM = japiTerm({ hyd: 63, salt: 2.8, oil: 0, sugar: 0 });

/** Multiplier on the yeast a dough needs, relative to Craig's reference dough. */
export const doughMultiplier = (f: Composition) => japiTerm(f) / REF_TERM;

/* ---------- the dough's temperature over time ---------- */

// Dough doesn't jump to fridge temperature: a 250 g ball takes ~3–4 h to fall from 24 °C to 8 °C
// and a 2 kg tub 7–9 h (lumped Newton cooling). The first warm hours in the fridge carry a large
// share of the fermentation; ignoring them is the classic reason cold doughs over-proof.

/** A stretch of the schedule: where the dough sits, for how long, and how big each piece is. */
export type Segment = { envC: number; hours: number; pieceG: number };

/** Thermal time constant (hours) for a piece of dough, scaling with its radius (∝ m^⅓). */
export const tauHours = (pieceG: number) => Math.min(10, Math.max(0.4, 2.0 * Math.cbrt(Math.max(20, pieceG) / 250)));

/**
 * One stretch of time somewhere at `envC`, starting with the dough at `startC`: the equivalent hours at
 * 21 °C it adds, and how warm the dough is at the end. Quarter-hour slices, each using the exact mean
 * of the exponential approach, so stretches chain without error.
 */
export function stretch(startC: number, envC: number, hours: number, tau: number): { eq: number; endC: number } {
  if (hours <= 0) return { eq: 0, endC: startC };
  const n = Math.max(1, Math.ceil(hours / 0.25));
  const dt = hours / n;
  const decay = Math.exp(-dt / tau);
  let T = startC;
  let eq = 0;
  for (let k = 0; k < n; k++) {
    const mean = envC + ((T - envC) * tau * (1 - decay)) / dt;
    eq += dt * rateAt(mean);
    T = envC + (T - envC) * decay;
  }
  return { eq, endC: T };
}

/**
 * Equivalent hours at 21 °C over a schedule, following the dough's temperature from `startC` (as it
 * comes off the mixer) as it settles towards each place it's kept.
 */
export function eqHours(segments: Segment[], startC: number): number {
  let T = startC;
  let eq = 0;
  for (const seg of segments) {
    const s = stretch(T, seg.envC, seg.hours, tauHours(seg.pieceG));
    eq += s.eq;
    T = s.endC;
  }
  return eq;
}
