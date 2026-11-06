/* Simuladores de la semana 2 */
"use strict";

document.addEventListener("DOMContentLoaded", () => {
  if (window.renderMathInElement) {
    renderMathInElement(document.body, {
      delimiters: [{ left: "$$", right: "$$", display: true }, { left: "\\(", right: "\\)", display: false }],
    });
  }
  simuladorMinimos();
  simuladorGradiente();
  simuladorComplejidad();
});

/* ── 1. Mínimos cuadrados ─────────────────────────────────────────────── */
function simuladorMinimos() {
  const X0 = [1, 2, 3, 4, 5, 6, 7, 8];
  const Y0 = [3.1, 4.4, 4.9, 6.3, 6.8, 8.4, 8.9, 10.2];
  const xs = [...X0], ys = [...Y0];
  const g = new Grafico(document.getElementById("c-minimos"), {
    xmin: 0, xmax: 9, ymin: 0, ymax: 12, ejeX: "Inversión publicitaria (millones)", ejeY: "Ventas (millones)",
  });
  const sB0 = enlazar("m-b0", () => g.dibujar());
  const sB1 = enlazar("m-b1", () => g.dibujar());
  const cuadr = document.getElementById("m-cuadrados");
  cuadr.addEventListener("change", () => g.dibujar());

  g.dibujar = () => {
    const b0 = sB0.valor(), b1 = sB1.valor();
    const yhat = xs.map(x => b0 + b1 * x);
    g.limpiar();
    g.ejes();
    g.recortar(() => {
      if (cuadr.checked) {
        // cuadrado de cada residuo, con lado igual al residuo en píxeles
        for (let i = 0; i < xs.length; i++) {
          const lado = Math.abs(g.Y(ys[i]) - g.Y(yhat[i]));
          const ctx = g.ctx, px = g.X(xs[i]);
          ctx.save();
          ctx.fillStyle = COLOR.ambarClaro; ctx.strokeStyle = COLOR.ambar; ctx.lineWidth = 1;
          ctx.fillRect(px, Math.min(g.Y(ys[i]), g.Y(yhat[i])), lado, lado);
          ctx.strokeRect(px, Math.min(g.Y(ys[i]), g.Y(yhat[i])), lado, lado);
          ctx.restore();
        }
      }
      for (let i = 0; i < xs.length; i++) g.segmento(xs[i], ys[i], xs[i], yhat[i], { color: COLOR.ambar, ancho: 2 });
      g.funcion(x => b0 + b1 * x, { color: COLOR.teal, ancho: 3 });
    });
    for (let i = 0; i < xs.length; i++) g.punto(xs[i], ys[i], { r: 6, relleno: COLOR.tinta });

    const met = metricas(ys, yhat);
    const opt = xs.length >= 2 ? minimosCuadrados(xs, ys) : { b0: 0, b1: 0 };
    const metOpt = metricas(ys, xs.map(x => opt.b0 + opt.b1 * x));
    document.getElementById("m-ecm").textContent = fmt(met.ecm);
    document.getElementById("m-mae").textContent = fmt(met.mae);
    document.getElementById("m-rmse").textContent = fmt(met.rmse);
    document.getElementById("m-r2").textContent = fmt(met.r2);
    document.getElementById("m-min").textContent = fmt(metOpt.ecm);
  };

  g.interaccion((x, y, e, px, py) => {
    let i = g.cercano(px, py, xs, ys, 14);
    if (i < 0) { xs.push(x); ys.push(y); i = xs.length - 1; }
    g.dibujar();
    return { mover: (x2, y2) => {
      xs[i] = Math.min(Math.max(x2, 0), 9); ys[i] = Math.min(Math.max(y2, 0), 12); g.dibujar();
    } };
  });

  document.getElementById("m-ajustar").addEventListener("click", () => {
    const { b0, b1 } = minimosCuadrados(xs, ys);
    sB0.fijar(Math.min(Math.max(b0, -2), 7));
    sB1.fijar(Math.min(Math.max(b1, -0.5), 2.5));
    g.dibujar();
  });
  document.getElementById("m-datos").addEventListener("click", () => {
    xs.length = 0; ys.length = 0; xs.push(...X0); ys.push(...Y0);
    sB0.fijar(4); sB1.fijar(0.5);
    g.dibujar();
  });
  g.dibujar();
}

/* ── 2. Descenso de gradiente ─────────────────────────────────────────── */
function simuladorGradiente() {
  const J = b => (b - 3) ** 2 + 1, dJ = b => 2 * (b - 3);
  const g = new Grafico(document.getElementById("c-gradiente"), {
    xmin: -2, xmax: 8, ymin: 0, ymax: 28, ejeX: "Parámetro β", ejeY: "Error J(β)",
  });
  const t = new Grafico(document.getElementById("c-trayectoria"), {
    xmin: 0, xmax: 30, ymin: -2, ymax: 8, ejeX: "Iteración", ejeY: "β",
    margen: { izq: 58, der: 16, sup: 10, inf: 42 },
  });
  let camino = [];
  const sEta = enlazar("g-eta", () => reiniciar(), v => fmt(v, 2));
  const sIni = enlazar("g-inicio", () => reiniciar(), v => fmt(v, 1));

  function reiniciar() { camino = [sIni.valor()]; dibujarTodo(); }
  function pasos(k) {
    const eta = sEta.valor();
    for (let i = 0; i < k; i++) {
      const b = camino[camino.length - 1];
      if (Math.abs(b) > 1e6) break;
      camino.push(b - eta * dJ(b));
    }
    dibujarTodo();
  }

  g.dibujar = () => {
    g.limpiar();
    g.ejes();
    const b = camino[camino.length - 1];
    g.recortar(() => {
      g.funcion(J, { color: COLOR.tinta, ancho: 2.5 });
      g.vertical(3, { color: COLOR.gris, ancho: 1, guion: [3, 4] });
      for (let i = 1; i < camino.length; i++) {
        g.segmento(camino[i - 1], J(camino[i - 1]), camino[i], J(camino[i]), { color: COLOR.ambar, ancho: 1.6, alfa: 0.8 });
      }
      camino.forEach((v, i) => g.punto(v, J(v), { r: i === camino.length - 1 ? 7 : 4, relleno: i === camino.length - 1 ? COLOR.teal : COLOR.ambar }));
      if (isFinite(b) && Math.abs(b) < 50) {
        const m = dJ(b);
        g.segmento(b - 1.6, J(b) - 1.6 * m, b + 1.6, J(b) + 1.6 * m, { color: COLOR.violeta, ancho: 2, guion: [6, 4] });
      }
    });
    g.texto("mínimo", 3, 27, { color: COLOR.suave, dx: 6, tam: 12 });
  };

  t.dibujar = () => {
    const n = Math.max(30, camino.length + 2);
    t.rango(0, n, -2, 8);
    t.limpiar();
    t.ejes();
    t.recortar(() => {
      t.segmento(0, 3, n, 3, { color: COLOR.gris, ancho: 1, guion: [3, 4] });
      t.linea(camino.map((_, i) => i), camino, { color: COLOR.teal, ancho: 2 });
      camino.forEach((v, i) => t.punto(i, v, { r: 3.5, relleno: COLOR.teal }));
    });
  };

  function dibujarTodo() {
    g.dibujar(); t.dibujar();
    const eta = sEta.valor(), b = camino[camino.length - 1], f = 1 - 2 * eta;
    document.getElementById("g-iter").textContent = camino.length - 1;
    document.getElementById("g-beta").textContent = Math.abs(b) > 1e4 ? "muy grande" : fmt(b, 3);
    document.getElementById("g-j").textContent = Math.abs(b) > 1e4 ? "muy grande" : fmt(J(b), 3);
    document.getElementById("g-pend").textContent = Math.abs(b) > 1e4 ? "—" : fmt(dJ(b), 3);
    document.getElementById("g-factor").textContent = fmt(f, 2);
    const nota = document.getElementById("g-nota");
    let texto, alerta = false;
    if (Math.abs(f) < 1e-9) texto = "El factor es cero: el primer paso cae exactamente en el mínimo.";
    else if (Math.abs(f) < 1 && f > 0) texto = "El factor está entre 0 y 1: cada paso acorta la distancia al mínimo sin cruzarlo.";
    else if (Math.abs(f) < 1) texto = "El factor es negativo: cada paso cruza al otro lado del mínimo, pero la distancia se acorta.";
    else if (Math.abs(f) === 1) { texto = "El factor vale −1: el parámetro rebota entre dos valores sin acercarse."; alerta = true; }
    else { texto = "El valor absoluto del factor es mayor que 1: cada paso aleja el parámetro del mínimo."; alerta = true; }
    nota.textContent = texto;
    nota.classList.toggle("alerta", alerta);
  }

  document.getElementById("g-paso").addEventListener("click", () => pasos(1));
  document.getElementById("g-diez").addEventListener("click", () => pasos(10));
  document.getElementById("g-reiniciar").addEventListener("click", reiniciar);
  reiniciar();
}

/* ── 3. Complejidad y regularización ──────────────────────────────────── */
function simuladorComplejidad() {
  const verdad = x => Math.sin(2 * Math.PI * x);
  const rng = aleatorio(11);
  const xtr = Array.from({ length: 18 }, (_, i) => (i + 0.5) / 18 + (rng() - 0.5) * 0.04);
  const ytr = xtr.map(x => verdad(x) + 0.3 * normal(rng));
  const rngTe = aleatorio(99);
  const xte = Array.from({ length: 200 }, () => rngTe());
  const yte = xte.map(x => verdad(x) + 0.3 * normal(rngTe));

  const g = new Grafico(document.getElementById("c-complejidad"), {
    xmin: 0, xmax: 1, ymin: -2, ymax: 2, ejeX: "x", ejeY: "y",
  });
  const c = new Grafico(document.getElementById("c-curvas"), {
    xmin: 1, xmax: 15, ymin: 0, ymax: 1.2, ejeX: "Grado del polinomio", ejeY: "RMSE", decX: 0, decY: 1,
    margen: { izq: 58, der: 16, sup: 10, inf: 42 },
  });
  const lam = v => (v <= -7.95 ? 0 : Math.pow(10, v));
  const fmtLam = v => (v <= -7.95 ? "≈ 0" : Math.pow(10, v) >= 0.01 ? fmt(Math.pow(10, v), 2) : Math.pow(10, v).toExponential(0).replace("e-", "×10⁻").replace(/⁻(\d)/, (_, d) => "⁻" + "⁰¹²³⁴⁵⁶⁷⁸⁹"[d]));
  const sG = enlazar("c-grado", () => dibujar(), v => fmt(v, 0));
  const sL = enlazar("c-lambda", () => dibujar(), fmtLam);

  const rmse = (f, x, y) => Math.sqrt(media(x.map((v, i) => (y[i] - f(v)) ** 2)));
  const ajustar = (d, l) => polinomioRidge(xtr, ytr, d, l, 0, 1);

  function dibujar() {
    const d = sG.valor(), l = lam(sL.valor());
    const f = ajustar(d, l);
    g.limpiar();
    g.ejes();
    g.recortar(() => {
      g.funcion(verdad, { color: COLOR.gris, ancho: 2, guion: [6, 5] });
      g.funcion(f, { color: COLOR.teal, ancho: 3, n: 500 });
    });
    for (let i = 0; i < xtr.length; i++) g.punto(xtr[i], ytr[i], { r: 5.5, relleno: COLOR.tinta });
    g.leyenda([{ texto: "Relación real", color: COLOR.gris, guion: [6, 5] }, { texto: "Modelo ajustado", color: COLOR.teal }], { lado: "der" });

    const grados = Array.from({ length: 15 }, (_, i) => i + 1);
    const tr = [], te = [];
    for (const k of grados) {
      const fk = ajustar(k, l);
      tr.push(rmse(fk, xtr, ytr));
      te.push(rmse(fk, xte, yte));
    }
    c.limpiar();
    c.ejes();
    c.recortar(() => {
      c.linea(grados, tr, { color: COLOR.teal, ancho: 2.5 });
      c.linea(grados, te.map(v => Math.min(v, 5)), { color: COLOR.ambar, ancho: 2.5 });
      c.vertical(d, { color: COLOR.gris, ancho: 1, guion: [3, 4] });
      c.punto(d, tr[d - 1], { r: 5.5, relleno: COLOR.teal });
      c.punto(d, Math.min(te[d - 1], 1.18), { r: 5.5, relleno: COLOR.ambar });
    });
    c.leyenda([{ texto: "Entrenamiento", color: COLOR.teal }, { texto: "Datos nuevos", color: COLOR.ambar }], { lado: "der" });

    const mejor = grados[te.indexOf(Math.min(...te))];
    document.getElementById("c-rtr").textContent = fmt(tr[d - 1], 3);
    document.getElementById("c-rte").textContent = te[d - 1] > 99 ? "muy grande" : fmt(te[d - 1], 3);
    document.getElementById("c-mejor").textContent = mejor;
    const nota = document.getElementById("c-nota");
    const brecha = te[d - 1] - tr[d - 1];
    if (tr[d - 1] > 0.5) { nota.textContent = "Ambos errores son altos: el modelo es demasiado rígido para la forma de los datos (subajuste)."; nota.classList.add("alerta"); }
    else if (brecha > 0.15) { nota.textContent = "El error en datos nuevos supera ampliamente al de entrenamiento: el modelo sigue el ruido (sobreajuste)."; nota.classList.add("alerta"); }
    else { nota.textContent = "Los dos errores son bajos y parecidos: el modelo generaliza bien."; nota.classList.remove("alerta"); }
  }
  g.dibujar = c.dibujar = dibujar;
  dibujar();
}
