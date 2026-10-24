# Migración desde la sesión de Codex

## Fuente

Archivo adjunto: `a-viva-voz-codigo.zip` (aprox. 2,8 MB). El ZIP contiene 231 entradas, incluidos directorios, activos de PDF.js, aplicación, documentación y pruebas.

## Verificación del ZIP original (2026-10-24)

```
node --test tests/*.test.mjs
# tests 28
# pass 28
# fail 0
```

La ejecución valida el código descomprimido, **no** la copia parcial del repositorio.

## Archivos publicados en GitHub

- `README.md`: documentación actualizada para reflejar el desarrollo existente.
- `.gitignore`
- `dist/icon.svg`
- `dist/reader-core.mjs`
- `dist/vendor/pdfjs/VERSION`

**Advertencia:** algunos archivos se cargaron anteriormente mediante transcripción, no transferencia binaria del ZIP. Deben compararse contra el original antes de dar la migración por concluida.

## Archivos esenciales aún pendientes

- `dist/index.html`
- `dist/app.mjs`
- `dist/styles.css`
- `dist/pdf-loader.mjs`
- `dist/vendor/pdfjs/legacy/build/pdf.mjs`
- `dist/vendor/pdfjs/legacy/build/pdf.worker.mjs`
- Los mapas CMap, fuentes, licencias y otros activos de PDF.js
- `tests/`, `scripts/` y documentación técnica restante

## Criterios de aceptación

1. Comparar recursivamente el árbol de GitHub con el ZIP, preservando rutas y bytes.
2. Evitar introducir secretos o archivos temporales.
3. Ejecutar `node --test` desde una copia recién obtenida del repositorio.
4. Iniciar el servidor estático y realizar pruebas de navegador.
5. Verificar extracción de PDF real, controles de voz, accesibilidad y vista móvil.
6. Confirmar licencias y compatibilidad de la distribución PDF.js.
7. Solo entonces marcar la migración como terminada y considerar un despliegue.

## Riesgos conocidos del producto

- PDF escaneados requieren OCR, no incluido.
- PDF protegidos o con orden de lectura complejo pueden fallar o leerse desordenados.
- Voces remotas del sistema pueden enviar texto al proveedor de voz.
- La síntesis de voz depende del navegador y no garantiza reproducción en segundo plano.
- Los datos de posición guardados localmente pueden perderse si se limpia el navegador.
