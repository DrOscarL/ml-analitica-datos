/* ==========================================================================
   config.js — Datos del repositorio en GitHub.
   Si el repositorio tiene otro nombre o pertenece a otra cuenta,
   cambie solo estas dos líneas: los botones «Abrir en Colab» se actualizan solos.
   ========================================================================== */
const SITIO = {
  usuario: "DrOscarL",
  repositorio: "ml-analitica-datos",
  rama: "main",
};

/* Convierte los enlaces con data-cuaderno="semana01/archivo.ipynb" en enlaces de Colab. */
document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("a[data-cuaderno]").forEach(a => {
    a.href = `https://colab.research.google.com/github/${SITIO.usuario}/${SITIO.repositorio}/blob/${SITIO.rama}/${a.dataset.cuaderno}`;
    a.target = "_blank";
    a.rel = "noopener";
  });
  document.querySelectorAll("a[data-archivo]").forEach(a => {
    a.href = `https://github.com/${SITIO.usuario}/${SITIO.repositorio}/blob/${SITIO.rama}/${a.dataset.archivo}`;
  });
});
