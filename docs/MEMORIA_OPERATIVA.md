# SonoPDF — continuidad operativa


## Continuidad autónoma — 2026-11-20

**Fuente oficial:** [DECISIONES.md](DECISIONES.md), documentación funcional, issues, PR y commits de **este repositorio**. El historial posterior prevalece sobre el hito del 19/11/2026 anotado más abajo. Ningún paso depende de `ai-project-control`.

- Recuperar el problema activo del issue [#2](https://github.com/medinacaj/SonoPDF/issues/2) y la rama/PR vigente. El workflow local de estado es un indicador, no prueba de hosting.
- Mantener cada decisión específica y su cambio aprobado dentro de `docs/DECISIONES.md`; no copiar versiones divergentes a un registro central.
- Al cerrar un trabajo: fecha, tarea, PR, SHA, pruebas/CI del SHA, entorno realmente verificado, bloqueo y siguiente acción.
- **Regla de seguridad:** no fusionar, desplegar ni habilitar operaciones reales por el resultado de una demo. Respetar fixtures sintéticos, roles, backups y permisos.

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
