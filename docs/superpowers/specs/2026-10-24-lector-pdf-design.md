# Lector de PDF en voz alta

## Objetivo
Crear una aplicación web en español, usable desde móvil y ordenador (plataforma elegida por el usuario), para subir un PDF y escucharlo mientras se sigue el texto.

## Primera versión propuesta
- Carga por selector de archivo y arrastrar/soltar, con límite explícito de 30 MB.
- Extracción local del texto del PDF por página usando PDF.js. El archivo no se envía a un servidor de la aplicación.
- Vista del texto extraído, navegación por página y énfasis del fragmento que se está leyendo.
- Reproducir, pausar, continuar, avanzar y retroceder fragmentos; selección de las voces disponibles y velocidad de 0,5 a 2.
- Una demostración de texto para probar la experiencia antes de subir un archivo.
- Guardado local del punto de lectura y los ajustes. Al abrir de nuevo el mismo PDF, recuperar la posición. No almacenar el PDF.
- Mensajes claros para PDF inválidos, protegidos y páginas sin texto.

## Enfoques
1. Recomendado: PDF.js y voces del navegador. Sin cuentas ni facturación por uso; las voces disponibles y su calidad dependen del dispositivo. El PDF se procesa localmente. Algunas voces del sistema pueden usar servicios del proveedor.
2. Servicio de voz externo: puede mejorar naturalidad y permitir generar audio descargable, pero requiere proveedor, credenciales, presupuesto y envío del texto. Fuera de esta primera versión.
La decisión de plataforma es del usuario. La recomendación de usar voces del navegador es del implementador y se presenta para aprobación.

## Límites y decisiones
No incluir OCR, exportación MP3, pagos, cuenta de usuario ni sincronización entre dispositivos. No prometer reproducción continua con la pantalla apagada ni voces idénticas entre navegadores.
Los archivos grandes se procesan con indicador de progreso. Una página vacía puede saltarse al reproducir. Un PDF sin texto muestra la necesidad de OCR.
El lector usa fragmentos cortos para mejorar la continuidad. Un cambio de página o voz cancela la lectura anterior y conserva una posición coherente. Los eventos obsoletos no deben reiniciar audio.

## Diseño propuesto
Interfaz de herramienta centrada en la lectura: cabecera compacta, área principal para cargar y leer, panel de ajustes y controles visibles. Fondo blanco/gris muy claro, texto oscuro, acento azul reservado para acción principal y fragmento activo. Tipografía del sistema, controles táctiles grandes, foco de teclado visible, mensajes accesibles y adaptación a 320 px.
Sin imágenes de decoración. Un símbolo de ondas sonoras identifica el producto y un indicador de fragmento ayuda a seguir la lectura.

## Arquitectura
Sitio estático HTML, CSS y JavaScript modular, PDF.js empaquetado con sus activos. SpeechSynthesis para voz. LocalStorage solo para ajustes y posiciones, con manejo de almacenamiento no disponible. Sin backend de documentos ni claves secretas.

## Validación
Comprobar extracción de un PDF real con varias páginas, errores de archivo, PDF sin texto y controles mediante un motor de voz simulado. Revisar vistas móvil y escritorio, navegación por teclado, integridad de activos y ausencia de subidas del PDF. La calidad audible de las voces requiere probar el dispositivo final.
Publicar como Site privado y entregar enlace, código fuente y límites comprobados.
