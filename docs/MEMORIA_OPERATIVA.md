# SonoPDF — continuidad operativa

**Alcance:** registro de continuidad del repositorio. No contiene credenciales, datos de clientes ni decisiones de otros productos.

## Orden de recuperación
1. Consultar instrucciones y decisiones existentes en este repositorio, incluyendo AGENTS.md y documentos específicos si existen; no sustituirlos.
2. Consultar [ESTADO_GITHUB_AUTO.md](ESTADO_GITHUB_AUTO.md), PR, SHA, issues y CI vivos. El snapshot puede estar desactualizado.
3. Continuar el bloqueo específico del issue [#2](https://github.com/medinacaj/SonoPDF/issues/2), tras verificar su estado actual.
4. Registrar aquí fecha, SHA, pruebas, entorno realmente verificado, bloqueo y siguiente acción tras cada trabajo.

## Hito de continuidad — 2026-11-19
- **[IMPLEMENTADO SIN VALIDAR]** Workflow de snapshot GitHub por eventos y cron en rama `chore/project-memory-sync-20261119`, pendiente de CI y revisión.
- **[PENDIENTE]** Confirmar las prioridades del producto con issue, PR y código actuales antes de tocar funcionalidad.
- **[PENDIENTE]** Fusionar piloto únicamente tras pruebas, comprobar archivo generado en rama predeterminada y registrar SHA de ejecución.
- **Entorno:** GitHub. Ningún hosting, despliegue o base de datos ha sido verificado ni modificado.
- **Siguiente acción:** validar PR de memoria y después comprobar sincronización por evento.
