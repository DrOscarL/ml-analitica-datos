/* Simuladores de la semana 1 */
"use strict";

document.addEventListener("DOMContentLoaded", () => {
  if (window.renderMathInElement) {
    renderMathInElement(document.body, {
      delimiters: [{ left: "$$", right: "$$", display: true }, { left: "\\(", right: "\\)", display: false }],
    });
  }
  simuladorAtipicos();
  simuladorHistograma();
  simuladorSimpson();
});

/* ── 1. Media, mediana y atípicos ─────────────────────────────────────── */
function simuladorAtipicos() {
  const base = [1.0, 1.1, 1.2, 1.2, 1.3, 1.4, 1.4, 1.5, 1.6, 1.7, 1.9, 2.0];
  const g = new Grafico(document.getElementById("c-atipicos"), {
    xmin: 0, xmax: 21, ymin: 0, ymax: 1, ejeX: "Salario mensual (millones de pesos)", ejeY: "",
    margen: { izq: 20, der: 16, sup: 14, inf: 46 },
  });
  const sG = enlazar("s-gerente", () => g.dibujar(), v => fmt(v, 1));
  const sK = enlazar("s-extremos", () => g.dibujar(), v => fmt(v, 0));

  g.dibujar = () => {
    const s = sG.valor(), k = sK.valor();
    const altos = [s, 0.75 * s, 0.55 * s].slice(0, k).map(v => Math.max(v, 1.5));
    const datos = [...base.slice(0, 12 - k), ...altos];
    const m = media(datos), med = mediana(datos), q1 = cuantil(datos, 0.25), q3 = cuantil(datos, 0.75);
    const ric = q3 - q1, li = q1 - 1.5 * ric, ls = q3 + 1.5 * ric;
    const atip = datos.filter(v => v < li || v > ls);
    const normales = datos.filter(v => v >= li && v <= ls);

    g.limpiar();
    g.ejes({ rejilla: false, ocultarY: true });
    g.recortar(() => {
      // límites de Tukey
      g.segmento(li, 0.08, li, 0.48, { color: COLOR.gris, ancho: 1.2, guion: [4, 4] });
      g.segmento(ls, 0.08, ls, 0.48, { color: COLOR.gris, ancho: 1.2, guion: [4, 4] });
      // diagrama de caja
      const yc = 0.28, h = 0.09;
      g.rect(q1, yc - h, q3, yc + h, { relleno: COLOR.tealClaro, borde: COLOR.teal, ancho: 1.5 });
      g.segmento(Math.min(...normales), yc, q1, yc, { color: COLOR.tinta, ancho: 1.5 });
      g.segmento(q3, yc, Math.max(...normales), yc, { color: COLOR.tinta, ancho: 1.5 });
      g.segmento(Math.min(...normales), yc - h / 2, Math.min(...normales), yc + h / 2, { color: COLOR.tinta, ancho: 1.5 });
      g.segmento(Math.max(...normales), yc - h / 2, Math.max(...normales), yc + h / 2, { color: COLOR.tinta, ancho: 1.5 });
      g.segmento(med, yc - h, med, yc + h, { color: COLOR.teal, ancho: 3 });
      for (const v of atip) g.punto(v, yc, { r: 4.5, relleno: COLOR.ambar });
      // media y mediana sobre el diagrama de puntos
      g.segmento(m, 0.52, m, 0.98, { color: COLOR.ambar, ancho: 2.5 });
      g.segmento(med, 0.52, med, 0.98, { color: COLOR.teal, ancho: 2.5 });
      // diagrama de puntos (apila valores cercanos)
      const pilas = {};
      for (const v of [...datos].sort((a, b) => a - b)) {
        const clave = Math.round(v / 0.2);
        const n = pilas[clave] = (pilas[clave] || 0) + 1;
        const esAtip = v < li || v > ls;
        g.punto(v, 0.6 + (n - 1) * 0.075, { r: 5.5, relleno: esAtip ? COLOR.ambar : COLOR.tinta });
      }
    });
    g.texto("media", m, 0.98, { color: COLOR.ambar, dx: 5, base: "top", tam: 12, negrita: true });
    g.texto("mediana", med, 0.98, { color: COLOR.teal, dx: -5, alinear: "right", base: "top", tam: 12, negrita: true });

    document.getElementById("l-media").textContent = fmt(m);
    document.getElementById("l-mediana").textContent = fmt(med);
    document.getElementById("l-desv").textContent = fmt(desviacion(datos));
    document.getElementById("l-ric").textContent = fmt(ric);
    document.getElementById("l-atip").textContent = atip.length;
    const sobre = datos.filter(v => v > m).length;
    const nota = document.getElementById("n-atipicos");
    nota.textContent = `${sobre} de los 12 empleados ${sobre === 1 ? "gana" : "ganan"} más que la media; la diferencia entre media y mediana es ${fmt(m - med)} millones.`;
    nota.classList.toggle("alerta", sobre <= 3);
  };
  g.dibujar();
}

/* ── 2. Histogramas y formas ──────────────────────────────────────────── */
function simuladorHistograma() {
  const n = 300, rng = aleatorio(7);
  const z = Array.from({ length: n }, () => normal(rng));
  const u = Array.from({ length: n }, () => rng());
  const g = new Grafico(document.getElementById("c-histograma"), {
    xmin: 0, xmax: 100, ymin: 0, ymax: 60, ejeX: "Valor de la variable", ejeY: "Frecuencia",
  });
  const forma = document.getElementById("s-forma");
  const color = document.getElementById("s-color");
  const sB = enlazar("s-bins", () => g.dibujar(), v => fmt(v, 0));
  const sS = enlazar("s-sep", () => g.dibujar(), v => fmt(v, 1));
  forma.addEventListener("change", () => g.dibujar());
  color.addEventListener("change", () => g.dibujar());

  g.dibujar = () => {
    const f = forma.value, k = sB.valor(), sep = sS.valor();
    sS.el.disabled = f !== "bim";
    color.disabled = f !== "bim";
    let datos, grupo = null;
    if (f === "sim") datos = z.map(v => 50 + 11 * v);
    else if (f === "asim") datos = z.map(v => 18 + 12 * Math.exp(0.6 * v));
    else {
      grupo = u.map(v => (v < 0.45 ? 1 : 0));
      datos = z.map((v, i) => (grupo[i] ? 50 + 6 * sep : 50 - 6 * sep) + 7 * v);
    }
    const dentro = datos.map(v => Math.min(Math.max(v, 0), 99.999));
    const hTot = histograma(dentro, 0, 100, k);
    const ymax = Math.max(10, Math.ceil(Math.max(...hTot.conteo) * 1.15 / 5) * 5);
    g.rango(0, 100, 0, ymax);
    g.limpiar();
    g.ejes();
    const porColor = grupo && color.checked;
    g.recortar(() => {
      if (porColor) {
        const hA = histograma(dentro.filter((_, i) => !grupo[i]), 0, 100, k).conteo;
        const hB = histograma(dentro.filter((_, i) => grupo[i]), 0, 100, k).conteo;
        for (let i = 0; i < k; i++) {
          const x0 = i * hTot.ancho, x1 = x0 + hTot.ancho;
          g.rect(x0, 0, x1, hA[i], { relleno: "rgba(109,63,217,0.55)", borde: "#fff" });
          g.rect(x0, hA[i], x1, hA[i] + hB[i], { relleno: "rgba(27,42,65,0.45)", borde: "#fff" });
        }
      } else {
        for (let i = 0; i < k; i++) {
          g.rect(i * hTot.ancho, 0, (i + 1) * hTot.ancho, hTot.conteo[i], { relleno: "rgba(27,42,65,0.35)", borde: "#fff" });
        }
      }
      const m = media(datos), med = mediana(datos);
      g.vertical(m, { color: COLOR.ambar, ancho: 2.5 });
      g.vertical(med, { color: COLOR.teal, ancho: 2.5, guion: [6, 4] });
    });
    const items = [{ texto: "Media", color: COLOR.ambar }, { texto: "Mediana", color: COLOR.teal, guion: [6, 4] }];
    if (porColor) items.push({ texto: "Población 1", color: "rgba(109,63,217,0.7)", tipo: "caja" }, { texto: "Población 2", color: "rgba(27,42,65,0.55)", tipo: "caja" });
    g.leyenda(items, { lado: "der" });
    const m = media(datos), med = mediana(datos);
    document.getElementById("h-media").textContent = fmt(m, 1);
    document.getElementById("h-mediana").textContent = fmt(med, 1);
    document.getElementById("h-dif").textContent = fmt(m - med, 1);
  };
  g.dibujar();
}

/* ── 3. Correlación y paradoja de Simpson ─────────────────────────────── */
function simuladorSimpson() {
  const rng = aleatorio(2024), nG = 40;
  const ruido = [0, 1, 2].map(() => Array.from({ length: nG }, () => [normal(rng), normal(rng)]));
  const colores = [COLOR.teal, COLOR.ambar, COLOR.violeta];
  const g = new Grafico(document.getElementById("c-simpson"), {
    xmin: 0, xmax: 10, ymin: 0, ymax: 10, ejeX: "Variable x", ejeY: "Variable y",
  });
  const sD = enlazar("s-desp", () => g.dibujar(), v => fmt(v, 2));
  const sP = enlazar("s-pend", () => g.dibujar(), v => fmt(v, 2));
  const ver = document.getElementById("s-grupos");
  ver.addEventListener("change", () => g.dibujar());

  g.dibujar = () => {
    const d = sD.valor(), b = sP.valor();
    const grupos = ruido.map((pares, j) => {
      const cx = 5 + 2.6 * d * (j - 1), cy = 5 - 2.6 * d * (j - 1);
      const x = pares.map(p => cx + 1.1 * p[0]);
      const y = x.map((xi, i) => cy + b * (xi - cx) + 0.6 * pares[i][1]);
      return { x, y };
    });
    const X = grupos.flatMap(gr => gr.x), Y = grupos.flatMap(gr => gr.y);
    const rG = correlacion(X, Y), rs = grupos.map(gr => correlacion(gr.x, gr.y));
    g.limpiar();
    g.ejes();
    g.recortar(() => {
      grupos.forEach((gr, j) => {
        for (let i = 0; i < nG; i++) g.punto(gr.x[i], gr.y[i], { r: 4, relleno: ver.checked ? colores[j] : COLOR.gris, alfa: 0.85 });
      });
      if (ver.checked) {
        grupos.forEach((gr, j) => {
          const { b0, b1 } = minimosCuadrados(gr.x, gr.y);
          const a = Math.min(...gr.x), c = Math.max(...gr.x);
          g.segmento(a, b0 + b1 * a, c, b0 + b1 * c, { color: colores[j], ancho: 3 });
        });
      }
      const { b0, b1 } = minimosCuadrados(X, Y);
      g.funcion(x => b0 + b1 * x, { color: COLOR.tinta, ancho: 2.5, guion: [7, 5] });
    });
    document.getElementById("r-global").textContent = fmt(rG);
    ["r-a", "r-b", "r-c"].forEach((id, j) => {
      document.getElementById(id).textContent = ver.checked ? fmt(rs[j]) : "oculto";
    });
    const nota = document.getElementById("n-simpson");
    const opuestos = rs.every(r => Math.sign(r) !== Math.sign(rG)) && Math.abs(rG) > 0.05;
    if (!ver.checked) {
      nota.textContent = "Active «Mostrar los grupos» para comparar la relación global con la de cada grupo.";
      nota.classList.remove("alerta");
    } else if (opuestos) {
      nota.textContent = "La relación global tiene el signo opuesto a la relación dentro de cada grupo.";
      nota.classList.add("alerta");
    } else {
      nota.textContent = "La relación global y la de cada grupo tienen el mismo signo.";
      nota.classList.remove("alerta");
    }
  };
  g.dibujar();
}
