# SonoPDF · Lector de PDF en voz alta

Aplicación web en español para escuchar documentos PDF desde móvil y ordenador. El código original de Codex se identifica como **A viva voz**; SonoPDF es el nombre del repositorio y una propuesta de marca, pendiente de verificación.

> **Estado de GitHub:** el repositorio contiene ya todos los archivos del ZIP original, verificados byte a byte, y las 28 pruebas pasan. Queda pendiente la verificación manual con PDF reales antes de desplegar.

## Funciones presentes en el ZIP original

- Lectura en voz alta de PDF con texto seleccionable (hasta 30 MB).
- Voz y velocidad ajustables (0,5×–2×).
- Reproducir, pausar, avanzar, retroceder y seleccionar fragmentos.
- Recuperación de la última posición al volver a abrir el mismo PDF en el navegador.
- Ejemplo integrado para probar sin archivo.
- Procesamiento local con PDF.js, sin subir el PDF a un servidor de la aplicación.

## Uso del proyecto original completo

Con todos los archivos del ZIP disponibles, desde la raíz:

```sh
python -m http.server 8765 --bind 127.0.0.1 --directory dist
```

Abrir http://127.0.0.1:8765 en un navegador moderno.

## Pruebas

```sh
node --test
```

**Verificación sobre el repositorio (24-10-2026): 28 pruebas aprobadas, 0 fallidas.**

## Arquitectura del ZIP

- `dist/app.mjs`: interfaz y preferencias.
- `dist/reader-core.mjs`: reproducción y fragmentación.
- `dist/pdf-loader.mjs`: validación y extracción.
- `dist/index.html` y `dist/styles.css`: interfaz.
- `dist/vendor/pdfjs`: PDF.js 6.4.299 y activos.
- `tests/`: pruebas de lógica, PDF y navegador.
- `scripts/vendor-pdfjs.py`: actualización verificada de dependencias.

## Privacidad y limitaciones

El PDF se procesa localmente; algunas voces del sistema pueden requerir servicios en línea. Las preferencias y últimas posiciones se almacenan localmente, sin guardar los PDF. No incluye OCR, exportación MP3 ni sincronización entre dispositivos. La reproducción con la pantalla bloqueada no está garantizada.

## Migración

El ZIP original debe conservarse como fuente de verdad hasta comparar cada archivo y completar la carga. Ver `docs/MIGRACION.md` para el estado y las verificaciones pendientes.
