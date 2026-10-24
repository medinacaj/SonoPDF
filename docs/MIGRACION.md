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

## Carga completa (2026-10-24)

Todos los archivos del ZIP se copiaron al repositorio mediante transferencia directa (sin transcripción), conservando rutas y bytes. Única excepción deliberada: `README.md`, que mantiene la versión actualizada del repositorio.

- Los archivos subidos antes por transcripción (`.gitignore`, `dist/icon.svg`, `dist/reader-core.mjs`, `dist/vendor/pdfjs/VERSION`) se compararon con el ZIP: **idénticos byte a byte**.
- `diff -r` entre el ZIP descomprimido y el repositorio: sin diferencias (salvo `README.md`, `.github/` y este documento, propios del repositorio).
- Pruebas sobre el repositorio: `node --test tests/*.test.mjs` → **28 aprobadas, 0 fallidas**.
- Prueba de humo en Chromium (servidor estático sobre `dist/`): la página carga sin errores de consola y el ejemplo integrado muestra su texto.
- PDF.js 6.4.299 incluye `LICENSE` (Apache 2.0), CMaps, fuentes estándar y WASM.
- Búsqueda de secretos: ninguno encontrado.

## Criterios de aceptación

Cumplidos: 1, 2, 3, 6 y, de forma básica, 4. Pendiente: 5 (verificación manual con PDF reales, voces, accesibilidad y vista móvil) y la decisión de desplegar.

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
