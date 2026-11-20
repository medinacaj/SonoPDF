# Norma técnica transversal — funcionalidad real con datos ficticios persistentes

**Decisión transversal confirmada el 15 de noviembre de 2026.** Copia operativa local migrada el 20/11/2026; debe adaptarse a las necesidades del producto, nunca sobrescribirse por una automatización.

> **Un sistema puede usar datos ficticios y ser totalmente funcional. Lo que no puede ser ficticio es su funcionamiento.**

## Reglas obligatorias

1. **No borrar fixtures útiles:** mantener usuarios, registros, eventos, compras, reportes, estadísticas, errores, estados y casos límite sintéticos de prueba; deben poder cargarse y restaurarse.
2. **Tres entornos aislados:** `development`, `staging/test` y `production`, con secretos, credenciales, servicios, bases de datos/almacenamiento y dominios/subdominios distintos; acceso y permisos separados. `staging` se comporta como producción, pero solo procesa datos ficticios autorizados.
3. **Funcionalidad real y verificable:** cada control visible ejecuta el comportamiento declarado o queda claramente deshabilitado con causa. Ningún botón, gráfico, CRUD, filtro, reporte, emisión ni proceso podrá ser meramente decorativo cuando se declare terminado.
4. **Persistencia backend real:** para los módulos con datos mutables, CRUD completo mediante API autenticada/autorizada y base de datos, con validación, estados, errores, auditoría y transacciones según riesgo. `localStorage`, JSON de UI y mocks pueden usarse **solo** como fixtures o complementos, nunca como fuente transaccional de una operación que se declara real.
5. **Seeds/reset seguros:** comandos reproducibles para cargar/reiniciar escenarios sintéticos; deben requerir `APP_ENV=development|staging`, credenciales/namespace de prueba y comprobación de identidad de la base. Denegar por diseño en `production`. Toda eliminación de registros de prueba debe estar restringida al ámbito sintético; no borrar ni alterar usuarios/órdenes reales.
6. **Hosting y dominio por sistema:** preparar runtime, contenedores/build, migraciones versionadas, configuración segura, TLS, secretos, logging, métricas, copias verificadas y recuperación para el dominio/hosting que corresponda. El deploy al dominio requiere permisos y revisión del propietario.
7. **Aislamiento de producción:** nunca permitir que fixtures, endpoints de reset, pasarelas sandbox o cuentas de prueba se mezclen con clientes reales. Si la persona propietaria autoriza pruebas en infraestructura productiva, usar tenant/namespace aislado y bases/datos no compartidos, permisos específicos y controles verificables.
8. **Validación obligatoria:** probar casos exitosos, fallos, permisos cruzados, persistencia tras reinicio, reinicios aislados, límites, concurrencia, responsive, teclado, privacidad y recovery usando datos ficticios **antes** de tráfico/finanzas/información real.
9. **No rehacer por reflejo:** recuperar avances de todas las ramas, PR, backend y fixtures; preferir adaptar módulos funcionales probados. Verificar CI y compatibilidad de los SHAs integrados. No imponer una arquitectura distinta sin ADR.
10. **Conservar demos como entornos de prueba, no como producto final:** el hito «DEMO completada» no equivale a «sistema finalizado». Mantener fixtures; sustituir simulaciones de lógica por operaciones backend reales.

## Definición de «terminado» para sistemas con estado mutante

- [ ] Una versión integrada y ejecutable (frontend, API, BD) en desarrollo y staging aislados.
- [ ] Funciones críticas y CRUD completan operaciones reales en la base de test, sobreviven reinicio y dan errores correctos.
- [ ] Seeds sintéticos recuperables y `reset` que falla cerrado ante cualquier configuración productiva; prueba automatizada de que las bases de producción no son blanco de fixtures.
- [ ] Roles/permisos, sesiones, logs, datos personales/secretos y separación entre clientes probados en servidor; no confiar en filtros de UI para aislamiento.
- [ ] Tests unitarios, integración con BD, E2E, accesibilidad proporcionada, concurrencia y restauración completados con evidencia `commit SHA + entorno + run + fecha`.
- [ ] Producción publicada en hosting/dominio propio autorizado, TLS/health/logging/backup/rollback verificados y tráfico real habilitado solo luego de aprobación.
- [ ] URLs operativas, documentación de instalación/operación y criterios de aceptación cumplidos; issue de entrega cerrado. Pendientes externos se identifican por dependencia, **no** se sustituyen con otra auditoría indefinida.

Una web exclusivamente editorial o biblioteca documental puede marcar «no aplica» para transacciones o backend **solo si no presenta CRUD, usuarios ni funcionalidades de sistema que lo requieran**; aun así todos sus enlaces, formularios, filtros o flujos anunciados tienen que funcionar realmente.

## Matriz para cada proyecto, no solo PR

| Componente | Existente/probado | Integrado | Staging aislado | Producción operativa | Bloqueo |
|---|---|---|---|---|---|
| UI crítica | Evidencia por SHA | SHA/PR | URL/E2E | URL/E2E | Específico |
| API/permisos | Contratos + tests | SHA/PR | Prueba de roles | Seguridad validada | Específico |
| BD/migraciones | Migraciones/fixtures | SHA/PR | Datos sintéticos CRUD | DB separada+backups | Específico |
| Reportes/jobs/procesos | Cifras/estados y tests | SHA/PR | E2E | Ejecución real | Específico |
| Semilla/reset | Script seguro + rechazo prod | SHA/PR | Restaurar fixture | **Prohibido sobre datos reales** | Específico |
| Hosting/dominio | Build/infra | SHA/PR | TLS/staging | TLS/health/rollback | Específico |

**Prioridades:** cerrar verticalmente un sistema por vez antes de abrir otra batería de issues genéricos, manteniendo puerta de seguridad según riesgo. En sistemas existentes, inventariar lo ya adelantado y completar brechas, no reconstruir demo. No fusionar ni desplegar funciones de negocio con credenciales o pagos reales sin aprobación explícita.

## Estado inicial

**Esta política es un mandato de implementación, NO una afirmación de que todos los sistemas ya estén operativos.** Crear registro por sistema, con evidencia de lo disponible, gap real y siguiente integración; diferenciar *DEMO usable*, *staging con backend*, y *producción verificada*. El cierre anterior de MultiDeck se refiere solo a su **hito DEMO v1** y no satisface esta definición final. PaseListo debe preservar su Centro de Control único, con **reportes entregables por productor** y sin panel autoadministrativo por cliente; TeleprompterCam sigue siendo gratuito con AdSense Auto ads y no debe inventarse una suscripción.


## Aplicación local

La interpretación y evidencia de esta norma se registra en este mismo repositorio mediante issues, PR, pruebas y `docs/MEMORIA_OPERATIVA.md`. No depende de repositorios externos de coordinación. Adaptar según alcance real de SonoPDF y respetar decisiones específicas.
