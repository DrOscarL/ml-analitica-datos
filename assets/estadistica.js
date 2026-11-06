/* ==========================================================================
   estadistica.js — Funciones numéricas para los simuladores.
   ========================================================================== */
"use strict";

/** Generador pseudoaleatorio con semilla (mulberry32): mismos datos en cada visita. */
function aleatorio(semilla) {
  let a = semilla >>> 0;
  return function () {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Normal estándar por Box–Muller a partir de un generador uniforme. */
function normal(rng) {
  let u = 0;
  while (u === 0) u = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rng());
}

const suma = v => v.reduce((a, b) => a + b, 0);
const media = v => suma(v) / v.length;
function varianza(v) {
  const m = media(v);
  return suma(v.map(x => (x - m) ** 2)) / (v.length - 1);
}
const desviacion = v => Math.sqrt(varianza(v));

/** Cuantil con interpolación lineal (equivale a numpy/pandas por defecto). */
function cuantil(v, p) {
  const s = [...v].sort((a, b) => a - b);
  const h = (s.length - 1) * p;
  const i = Math.floor(h);
  return s[i] + (h - i) * ((s[i + 1] ?? s[i]) - s[i]);
}
const mediana = v => cuantil(v, 0.5);

function correlacion(x, y) {
  const mx = media(x), my = media(y);
  let sxy = 0, sxx = 0, syy = 0;
  for (let i = 0; i < x.length; i++) {
    sxy += (x[i] - mx) * (y[i] - my);
    sxx += (x[i] - mx) ** 2;
    syy += (y[i] - my) ** 2;
  }
  return sxy / Math.sqrt(sxx * syy);
}

/** Recta de mínimos cuadrados: devuelve { b0, b1 }. */
function minimosCuadrados(x, y) {
  const mx = media(x), my = media(y);
  let sxy = 0, sxx = 0;
  for (let i = 0; i < x.length; i++) {
    sxy += (x[i] - mx) * (y[i] - my);
    sxx += (x[i] - mx) ** 2;
  }
  const b1 = sxx > 0 ? sxy / sxx : 0;
  return { b0: my - b1 * mx, b1 };
}

/** Métricas de error de una predicción. */
function metricas(y, yhat) {
  const n = y.length;
  const e = y.map((v, i) => v - yhat[i]);
  const ecm = suma(e.map(v => v * v)) / n;
  const mae = suma(e.map(Math.abs)) / n;
  const my = media(y);
  const sst = suma(y.map(v => (v - my) ** 2));
  return { ecm, mae, rmse: Math.sqrt(ecm), r2: sst > 0 ? 1 - ecm * n / sst : NaN };
}

/** Resuelve A·x = b por eliminación gaussiana con pivoteo parcial. */
function resolver(A, b) {
  const n = b.length;
  const M = A.map((fila, i) => [...fila, b[i]]);
  for (let c = 0; c < n; c++) {
    let p = c;
    for (let f = c + 1; f < n; f++) if (Math.abs(M[f][c]) > Math.abs(M[p][c])) p = f;
    [M[c], M[p]] = [M[p], M[c]];
    const piv = M[c][c] || 1e-12;
    for (let f = c + 1; f < n; f++) {
      const k = M[f][c] / piv;
      for (let j = c; j <= n; j++) M[f][j] -= k * M[c][j];
    }
  }
  const x = new Array(n).fill(0);
  for (let f = n - 1; f >= 0; f--) {
    let s = M[f][n];
    for (let j = f + 1; j < n; j++) s -= M[f][j] * x[j];
    x[f] = s / (M[f][f] || 1e-12);
  }
  return x;
}

/**
 * Regresión polinomial con penalización ridge.
 * x se lleva a [−1, 1] para estabilizar el cálculo; el intercepto no se penaliza.
 * Devuelve una función que predice para un x cualquiera.
 */
function polinomioRidge(x, y, grado, lambda, xmin = 0, xmax = 1) {
  const esc = v => 2 * (v - xmin) / (xmax - xmin) - 1;
  const fila = v => { const z = esc(v); const f = [1]; for (let k = 1; k <= grado; k++) f.push(f[k - 1] * z); return f; };
  const X = x.map(fila);
  const p = grado + 1;
  const A = Array.from({ length: p }, () => new Array(p).fill(0));
  const b = new Array(p).fill(0);
  for (let i = 0; i < X.length; i++) {
    for (let j = 0; j < p; j++) {
      b[j] += X[i][j] * y[i];
      for (let k = 0; k < p; k++) A[j][k] += X[i][j] * X[i][k];
    }
  }
  for (let j = 1; j < p; j++) A[j][j] += lambda + 1e-10;
  const beta = resolver(A, b);
  return v => { const f = fila(v); let s = 0; for (let j = 0; j < p; j++) s += beta[j] * f[j]; return s; };
}

/** Conteo por intervalos de igual ancho. */
function histograma(v, min, max, k) {
  const ancho = (max - min) / k;
  const conteo = new Array(k).fill(0);
  for (const x of v) {
    let i = Math.floor((x - min) / ancho);
    if (i === k) i = k - 1;
    if (i >= 0 && i < k) conteo[i]++;
  }
  return { conteo, ancho };
}
