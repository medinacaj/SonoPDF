# SonoPDF · Lector de PDF en voz alta

Aplicación web en español para escuchar documentos PDF desde móvil y ordenador. El código original de Codex usaba el nombre provisional «A viva voz»; el producto se llama **SonoPDF**.

> **Estado de GitHub:** el repositorio contiene ya todos los archivos del ZIP original, verificados byte a byte, y las 28 pruebas pasan. Existen pruebas automatizadas de Chromium con PDF local y CI de Pages aprobada; todavía falta QA manual con archivos reales variados, tecnología asistiva y dispositivos físicos antes de considerar la accesibilidad y compatibilidad completas.

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

**Verificación:** suite Node y prueba Chromium con PDF local en GitHub Actions. Consultar la ejecución del commit vigente; no asumir que PDFs grandes, protegidos o escaneados han pasado un ensayo humano.

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

## Continuidad y estado verificable · 21/11/2026

**Propósito:** Lector de PDF en voz alta, con procesamiento local.

**Límite:** No posee OCR ni garantía de compatibilidad con todos los dispositivos.

- **Código:** revisar commits y PR recientes del propio repositorio, sin trasladar supuestos de otro producto.
- **Pruebas/CI:** verificar los workflows y resultados asociados al SHA exacto. Esta actualización del README no constituye prueba funcional.
- **Despliegue:** confirmar por separado la versión servida y el funcionamiento real del entorno; demo o CI verde no acreditan producción.
- **Operación:** continuar el último bloqueo real, documentando rama, SHA, PR, evidencia de pruebas, entorno verificado y siguiente acción.
- **Protección:** preservar fixtures sintéticos, separar entornos y no divulgar credenciales ni datos reales.

**Fuente oficial:** documentación y decisiones de este producto. Leer [memoria operativa](docs/MEMORIA_OPERATIVA.md) y [decisiones](docs/DECISIONES.md). [Issue relevante](https://github.com/medinacaj/SonoPDF/issues/2).
