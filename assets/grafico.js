/* ==========================================================================
   grafico.js — Utilidad mínima para dibujar gráficos en <canvas>.
   Gestiona la densidad de píxeles, los ejes, la conversión de coordenadas
   y la interacción con el puntero (clic y arrastre).
   ========================================================================== */
"use strict";

const COLOR = {
  tinta: "#1b2a41",
  suave: "#4a5568",
  tenue: "#a0aec0",
  linea: "#d9dee5",
  rejilla: "#eef1f5",
  teal: "#00897b",
  tealClaro: "rgba(0,137,123,0.18)",
  ambar: "#d97706",
  ambarClaro: "rgba(217,119,6,0.18)",
  violeta: "#6d3fd9",
  violetaClaro: "rgba(109,63,217,0.18)",
  gris: "#8a94a6",
};
const FUENTE = '"Atkinson Hyperlegible", "Helvetica Neue", Arial, sans-serif';

/** Formatea un número con coma decimal. */
function fmt(v, d = 2) {
  if (!isFinite(v)) return "—";
  const s = Math.abs(v) < 0.5 * Math.pow(10, -d) ? (0).toFixed(d) : v.toFixed(d);
  return s.replace(".", ",").replace(/\B(?=(\d{3})+(?!\d))(?=.*,)/g, ".");
}

/** Elige marcas «redondas» para un eje. */
function marcas(min, max, n = 6) {
  const rango = max - min;
  if (rango <= 0) return [min];
  const paso0 = rango / n;
  const mag = Math.pow(10, Math.floor(Math.log10(paso0)));
  const norm = paso0 / mag;
  const paso = (norm < 1.5 ? 1 : norm < 3 ? 2 : norm < 7 ? 5 : 10) * mag;
  const out = [];
  for (let v = Math.ceil(min / paso) * paso; v <= max + 1e-9; v += paso) out.push(+v.toFixed(10));
  return out;
}

class Grafico {
  /**
   * @param {HTMLCanvasElement} canvas
   * @param {object} op  xmin, xmax, ymin, ymax, ejeX, ejeY, margen, logX
   */
  constructor(canvas, op = {}) {
    this.c = canvas;
    this.ctx = canvas.getContext("2d");
    this.op = Object.assign({ xmin: 0, xmax: 1, ymin: 0, ymax: 1, ejeX: "", ejeY: "",
      margen: { izq: 58, der: 16, sup: 14, inf: 46 }, logX: false, decX: null, decY: null }, op);
    this.dibujar = () => {};
    this._ajustar();
    new ResizeObserver(() => { this._ajustar(); this.dibujar(); }).observe(canvas);
  }

  _ajustar() {
    const r = this.c.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.w = Math.max(r.width, 10);
    this.h = Math.max(r.height, 10);
    this.c.width = Math.round(this.w * dpr);
    this.c.height = Math.round(this.h * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  get m() {
    const m = this.op.margen;
    return this.w < 420 ? { izq: Math.min(m.izq, 46), der: m.der, sup: m.sup, inf: m.inf } : m;
  }

  rango(xmin, xmax, ymin, ymax) {
    Object.assign(this.op, { xmin, xmax, ymin, ymax });
  }

  _tx(x) { return this.op.logX ? Math.log10(x) : x; }
  X(x) {
    const m = this.m, a = this._tx(this.op.xmin), b = this._tx(this.op.xmax);
    return m.izq + (this._tx(x) - a) / (b - a) * (this.w - m.izq - m.der);
  }
  Y(y) {
    const m = this.m;
    return this.h - m.inf - (y - this.op.ymin) / (this.op.ymax - this.op.ymin) * (this.h - m.sup - m.inf);
  }
  invX(px) {
    const m = this.m, a = this._tx(this.op.xmin), b = this._tx(this.op.xmax);
    const t = a + (px - m.izq) / (this.w - m.izq - m.der) * (b - a);
    return this.op.logX ? Math.pow(10, t) : t;
  }
  invY(py) {
    const m = this.m;
    return this.op.ymin + (this.h - m.inf - py) / (this.h - m.sup - m.inf) * (this.op.ymax - this.op.ymin);
  }
  dentro(px, py) {
    const m = this.m;
    return px >= m.izq && px <= this.w - m.der && py >= m.sup && py <= this.h - m.inf;
  }

  limpiar() {
    this.ctx.clearRect(0, 0, this.w, this.h);
  }

  /** Dibuja rejilla, ejes, marcas y títulos de eje. */
  ejes({ rejilla = true, ocultarY = false } = {}) {
    const g = this.ctx, m = this.m, o = this.op;
    g.save();
    g.font = `12px ${FUENTE}`;
    g.fillStyle = COLOR.suave;
    g.strokeStyle = COLOR.rejilla;
    g.lineWidth = 1;
    const mx = o.logX
      ? marcas(Math.log10(o.xmin), Math.log10(o.xmax), 6).filter(Number.isInteger).map(v => Math.pow(10, v))
      : marcas(o.xmin, o.xmax, this.w < 420 ? 4 : 7);
    const my = marcas(o.ymin, o.ymax, 5);
    g.textAlign = "center"; g.textBaseline = "top";
    for (const v of mx) {
      const px = this.X(v);
      if (rejilla) { g.beginPath(); g.moveTo(px, m.sup); g.lineTo(px, this.h - m.inf); g.stroke(); }
      const et = o.logX ? (v >= 1 ? fmt(v, 0) : String(v).replace(".", ",")) : fmt(v, o.decX ?? (Math.abs(mx[1] - mx[0]) < 1 ? 1 : 0));
      g.fillText(et, px, this.h - m.inf + 6);
    }
    g.textAlign = "right"; g.textBaseline = "middle";
    for (const v of my) {
      const py = this.Y(v);
      if (rejilla) { g.beginPath(); g.moveTo(m.izq, py); g.lineTo(this.w - m.der, py); g.stroke(); }
      if (!ocultarY) g.fillText(fmt(v, o.decY ?? (Math.abs(my[1] - my[0]) < 1 ? 1 : 0)), m.izq - 7, py);
    }
    g.strokeStyle = COLOR.tenue;
    g.beginPath();
    g.moveTo(m.izq, m.sup); g.lineTo(m.izq, this.h - m.inf); g.lineTo(this.w - m.der, this.h - m.inf);
    g.stroke();
    g.fillStyle = COLOR.tinta;
    g.font = `13px ${FUENTE}`;
    g.textAlign = "center"; g.textBaseline = "bottom";
    g.fillText(o.ejeX, m.izq + (this.w - m.izq - m.der) / 2, this.h - 4);
    g.save();
    g.translate(14, m.sup + (this.h - m.sup - m.inf) / 2);
    g.rotate(-Math.PI / 2);
    g.textBaseline = "middle";
    g.fillText(o.ejeY, 0, 0);
    g.restore();
    g.restore();
  }

  /** Limita el dibujo al área de datos. */
  recortar(fn) {
    const g = this.ctx, m = this.m;
    g.save();
    g.beginPath();
    g.rect(m.izq, m.sup, this.w - m.izq - m.der, this.h - m.sup - m.inf);
    g.clip();
    fn();
    g.restore();
  }

  punto(x, y, { r = 4.5, relleno = COLOR.tinta, borde = "#fff", ancho = 1.2, alfa = 1 } = {}) {
    const g = this.ctx;
    g.save();
    g.globalAlpha = alfa;
    g.beginPath();
    g.arc(this.X(x), this.Y(y), r, 0, 2 * Math.PI);
    g.fillStyle = relleno; g.fill();
    if (borde) { g.lineWidth = ancho; g.strokeStyle = borde; g.stroke(); }
    g.restore();
  }

  linea(xs, ys, { color = COLOR.tinta, ancho = 2, guion = [], alfa = 1 } = {}) {
    const g = this.ctx;
    g.save();
    g.globalAlpha = alfa;
    g.strokeStyle = color; g.lineWidth = ancho; g.setLineDash(guion);
    g.lineJoin = "round"; g.lineCap = "round";
    g.beginPath();
    let empezo = false;
    for (let i = 0; i < xs.length; i++) {
      if (!isFinite(ys[i])) { empezo = false; continue; }
      const px = this.X(xs[i]), py = this.Y(ys[i]);
      if (!empezo) { g.moveTo(px, py); empezo = true; } else g.lineTo(px, py);
    }
    g.stroke();
    g.restore();
  }

  funcion(f, { n = 300, ...estilo } = {}) {
    const xs = [], ys = [];
    for (let i = 0; i <= n; i++) {
      const x = this.op.xmin + (this.op.xmax - this.op.xmin) * i / n;
      xs.push(x); ys.push(f(x));
    }
    this.linea(xs, ys, estilo);
  }

  segmento(x1, y1, x2, y2, estilo = {}) { this.linea([x1, x2], [y1, y2], estilo); }

  vertical(x, estilo = {}) { this.linea([x, x], [this.op.ymin, this.op.ymax], estilo); }

  rect(x1, y1, x2, y2, { relleno = COLOR.tealClaro, borde = null, ancho = 1 } = {}) {
    const g = this.ctx;
    const a = this.X(x1), b = this.X(x2), c = this.Y(y1), d = this.Y(y2);
    g.save();
    g.fillStyle = relleno;
    g.fillRect(Math.min(a, b), Math.min(c, d), Math.abs(b - a), Math.abs(d - c));
    if (borde) { g.strokeStyle = borde; g.lineWidth = ancho; g.strokeRect(Math.min(a, b), Math.min(c, d), Math.abs(b - a), Math.abs(d - c)); }
    g.restore();
  }

  texto(t, x, y, { color = COLOR.tinta, tam = 12, alinear = "left", base = "middle", negrita = false, dx = 0, dy = 0 } = {}) {
    const g = this.ctx;
    g.save();
    g.font = `${negrita ? "600 " : ""}${tam}px ${FUENTE}`;
    g.fillStyle = color; g.textAlign = alinear; g.textBaseline = base;
    g.fillText(t, this.X(x) + dx, this.Y(y) + dy);
    g.restore();
  }

  /** Leyenda en la esquina superior izquierda o derecha del área de datos. */
  leyenda(items, { lado = "izq" } = {}) {
    const g = this.ctx, m = this.m;
    g.save();
    g.font = `12px ${FUENTE}`;
    const anchoTexto = Math.max(...items.map(i => g.measureText(i.texto).width));
    const x0 = lado === "izq" ? m.izq + 10 : this.w - m.der - anchoTexto - 40;
    let y0 = m.sup + 12;
    g.fillStyle = "rgba(255,255,255,0.88)";
    g.fillRect(x0 - 6, y0 - 10, anchoTexto + 38, items.length * 18 + 4);
    for (const it of items) {
      g.strokeStyle = it.color; g.fillStyle = it.color; g.lineWidth = 2.5;
      g.setLineDash(it.guion || []);
      if (it.tipo === "punto") { g.beginPath(); g.arc(x0 + 10, y0, 4, 0, 2 * Math.PI); g.fill(); }
      else if (it.tipo === "caja") { g.fillRect(x0 + 3, y0 - 5, 14, 10); }
      else { g.beginPath(); g.moveTo(x0, y0); g.lineTo(x0 + 20, y0); g.stroke(); }
      g.setLineDash([]);
      g.fillStyle = COLOR.tinta; g.textBaseline = "middle";
      g.fillText(it.texto, x0 + 28, y0);
      y0 += 18;
    }
    g.restore();
  }

  /**
   * Registra la interacción con el puntero.
   * alPulsar(x, y, evento) devuelve un objeto «arrastre» opcional con mover(x, y).
   */
  interaccion(alPulsar) {
    let arrastre = null;
    const pos = e => {
      const r = this.c.getBoundingClientRect();
      return [e.clientX - r.left, e.clientY - r.top];
    };
    this.c.addEventListener("pointerdown", e => {
      const [px, py] = pos(e);
      if (!this.dentro(px, py)) return;
      arrastre = alPulsar(this.invX(px), this.invY(py), e, px, py) || null;
      if (arrastre) this.c.setPointerCapture(e.pointerId);
    });
    this.c.addEventListener("pointermove", e => {
      if (!arrastre) return;
      const [px, py] = pos(e);
      arrastre.mover(this.invX(px), this.invY(py));
    });
    const fin = () => { if (arrastre && arrastre.soltar) arrastre.soltar(); arrastre = null; };
    this.c.addEventListener("pointerup", fin);
    this.c.addEventListener("pointercancel", fin);
  }

  /** Índice del punto más cercano (en píxeles) a la posición indicada. */
  cercano(px, py, xs, ys, radio = 12) {
    let mejor = -1, dmin = radio;
    for (let i = 0; i < xs.length; i++) {
      const d = Math.hypot(this.X(xs[i]) - px, this.Y(ys[i]) - py);
      if (d < dmin) { dmin = d; mejor = i; }
    }
    return mejor;
  }
}

/** Conecta un control deslizante con su salida y una función de actualización. */
function enlazar(id, alCambiar, formato = v => fmt(v, 2)) {
  const el = document.getElementById(id);
  const out = document.querySelector(`output[for="${id}"]`);
  const leer = () => {
    const v = parseFloat(el.value);
    if (out) out.textContent = formato(v);
    return v;
  };
  el.addEventListener("input", () => alCambiar(leer()));
  return { valor: leer, el, fijar: v => { el.value = v; leer(); } };
}
