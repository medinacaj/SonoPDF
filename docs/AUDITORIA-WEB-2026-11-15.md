# Auditoría incremental SonoPDF — 15/11/2026

SonoPDF procesa archivos PDF en el navegador mediante PDF.js; los documentos **no se envían a la aplicación**. La voz puede corresponder a un servicio del sistema y, según el dispositivo, procesarse en línea; no afirmar privacidad absoluta del proveedor de síntesis.

| Control | Estado | Evidencia y límite |
|---|---|---|
| PDF con texto local | Verificado en Chromium | `tests/browser-privacy.py` carga PDF generado sin solicitudes remotas |
| PDF sin texto escaneado o gráfico | Verificado en Chromium tras CI | Texto de limitación y aviso de OCR no disponible, botón de lectura inactivo |
| PDF corrupto y archivo vacío | Verificado en Chromium tras CI | Error visible, preservación del último documento válido, sin contenido ficticio |
| Límite 30 MB y extensión .pdf | Verificado con tests de módulo | `dist/pdf-loader.mjs` y suite Node |
| Responsive 320–1280 px | Verificado en Chromium | Sin desbordamiento horizontal |
| Audio, voz, velocidad y lector de pantalla | Parcial | Lógica cubierta en tests; voces y lector asistivo requieren dispositivo real |
| Contraste, navegación, PDFs protegidos, grandes, múltiples idiomas | Pendiente QA manual | No se afirman resultados no probados |
| Privacidad de PDF local | Verificado en prueba de red | Sin subida a servidores desde el flujo probado; servicio de voz externo no descartado |
| Backend, registro, cuentas, comercio | No aplicable | Herramienta estática no transaccional |
| Seguridad de rama principal | Pendiente de configuración GitHub | El indicador `protected:false` no es protección efectiva |

La ejecución de CI no certifica WCAG 2.2 AA completo ni soporta OCR. **El issue #2 permanece abierto** hasta QA manual/operativa de los controles que requieren dispositivos y PDFs reales autorizados.
