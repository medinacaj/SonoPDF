# SonoPDF — memoria operativa vigente

**Revisión de continuidad:** 2026-11-20. **Fuente única:** este repositorio. Estado histórico de 19/11 conservado en el historial de Git y documentos de antecedentes, no es una instrucción activa.

## Orden para continuar

1. Leer [DECISIONES.md](DECISIONES.md) y [CRITERIOS_FUNCIONALIDAD_REAL_Y_FIXTURES.md](CRITERIOS_FUNCIONALIDAD_REAL_Y_FIXTURES.md).
2. Consultar [ESTADO_GITHUB_AUTO.md](ESTADO_GITHUB_AUTO.md), [issue #2](https://github.com/medinacaj/SonoPDF/issues/2), PR/ramas/commits y CI **en vivo**. El snapshot puede estar desactualizado.
3. Distinguir código implementado de CI aprobada y de despliegue real; no inventar pruebas ni porcentajes.
4. Continuar el último bloqueo real. Al finalizar registrar fecha, PR/SHA, pruebas, entorno verificado, pendientes y siguiente acción en este repositorio.

## Decisiones y bloqueo de referencia

**[CONFIRMADO]** Preservar el procesamiento local de PDF cuando esté implementado y probado. Evitar enviar documentos privados al servidor sin necesidad técnica y permiso.

**[PENDIENTE DE REVISIÓN]** Validar issue #2, auditoría y pruebas actuales; no exigir backend por defecto para funciones locales.

**Siguiente acción:** comprobar el bloqueo más reciente de #2 y corregirlo con evidencia reproducible.

## Independencia

Ningún paso requiere consultar, sincronizar o actualizar un repositorio central de coordinación. Las decisiones explícitas posteriores del propietario prevalecen y se documentan aquí. Las acciones automáticas solo actualizan metadatos; no sobrescriben decisiones ni inventan estados de producción.
