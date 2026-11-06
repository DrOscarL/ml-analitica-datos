# Machine Learning · Especialización en Analítica de Datos

Sitio de simuladores interactivos del curso. Cada semana se publica una página con simuladores que explican visualmente lo visto en clase, más los cuadernos de Colab de la práctica.

Sitio publicado: `https://DrOscarL.github.io/ml-analitica-datos/`

## Estructura

```
index.html            Portada con las 8 semanas
assets/estilo.css     Estilos comunes
assets/grafico.js     Utilidad de gráficos en <canvas>
assets/estadistica.js Funciones numéricas (media, cuantiles, mínimos cuadrados, ridge…)
assets/config.js      Usuario y nombre del repositorio (para los enlaces a Colab)
semana01/             Página, simuladores y cuaderno de práctica de la semana 1
semana02/             Página, simuladores y cuadernos de la semana 2
```

## Publicar en GitHub Pages

1. En GitHub, cree un repositorio **público** llamado `ml-analitica-datos`.
2. Pulse **Add file → Upload files** y arrastre **todo el contenido** de esta carpeta (no la carpeta en sí): `index.html`, `README.md`, `.nojekyll`, `assets/`, `semana01/`, `semana02/`. Confirme con **Commit changes**.
3. Vaya a **Settings → Pages**. En *Source* elija **Deploy from a branch**, rama **main**, carpeta **/ (root)**, y pulse **Save**.
4. Después de uno o dos minutos el sitio queda en `https://DrOscarL.github.io/ml-analitica-datos/`.

Si usa otro nombre de repositorio u otra cuenta, cambie las dos líneas de `assets/config.js`; los botones «Abrir en Colab» se actualizan solos.

> El archivo `.nojekyll` empieza con punto y algunos sistemas lo ocultan. Si no aparece al arrastrar, créelo en GitHub con **Add file → Create new file**, nombre `.nojekyll`, contenido vacío.

## Agregar una semana nueva

1. Suba la carpeta `semanaNN/` (con su `index.html`, `simuladores.js` y cuadernos).
2. En `index.html` de la portada, cambie esa semana de `<li class="pendiente">` a `<li>`, enlace el título y reemplace «Próximamente» por el botón «Abrir simuladores» (copie el formato de la semana 1).
3. Agregue el enlace en la barra superior (`<nav>`) de las páginas.

## Probar en su computador

Los simuladores funcionan abriendo los archivos con un servidor local, por ejemplo:

```
python -m http.server 8000
```

y visitando `http://localhost:8000`.
