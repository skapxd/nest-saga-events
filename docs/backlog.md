# Backlog de Implementación: Módulo de Sagas y Eventos (Versión 2)

Este documento desglosa las tareas para **evolucionar** el módulo existente (`event-saga-module-export`) hacia la arquitectura definida en `docs/saga-module-design.md`.

## Fase 0: Setup y Migración

- [ ] **Tarea 1: Migrar el Módulo Existente.**
  - **Descripción:** Copiar el contenido de `event-saga-module-export/` a una nueva carpeta `src/saga-event-module/` en el proyecto actual. Adaptar los paths en `tsconfig.json` si es necesario para que las importaciones (`#/...`) funcionen.
  - **Acción:** `cp -r event-saga-module-export/* src/saga-event-module/` y ajustes de configuración.
  - **Dependencias:** Ninguna.
- [ ] **VERIFICACIÓN DE FASE 0:** Ejecutar `yarn build` para asegurar que el código base migrado compila sin errores.

## Fase 1: Implementación del Contexto Automático

*Esta fase introduce `AsyncLocalStorage` para eliminar la propagación manual de metadatos.*

- [ ] **Tarea 2: Crear el `RequestContextService`.**
  - **Descripción:** Implementar el servicio que encapsula `AsyncLocalStorage` para gestionar el contexto de la transacción.
  - **Archivo a crear:** `src/saga-event-module/services/request-context.service.ts`
  - **Dependencias:** Tarea 1.

- [ ] **Tarea 3: Crear el `SagaRegistryService`.**
  - **Descripción:** Implementar el servicio singleton que registrará en memoria la información de los decoradores `@EmitsEvent` y `@OnEventDoc`.
  - **Archivo a crear:** `src/saga-event-module/services/saga-registry.service.ts`
  - **Dependencias:** Tarea 1.

- [ ] **Tarea 4: Refactorizar `EventMetadataHelper`.**
  - **Descripción:** Modificar radicalmente el helper existente. Debe usar el `RequestContextService` para obtener el contexto inicial y dejar de aceptar `actor` y `previousPayload` como argumentos manuales.
  - **Archivo a modificar:** `src/saga-event-module/common/helpers/event-metadata/event-metadata.helper.ts`
  - **Dependencias:** Tarea 2.

- [ ] **Tarea 5: Implementar el `RequestContextMiddleware`.**
  - **Descripción:** Crear un middleware de NestJS que utilice el `RequestContextService` para establecer el contexto al inicio de cada petición HTTP.
  - **Archivo a crear:** `src/saga-event-module/middleware/request-context.middleware.ts`
  - **Dependencias:** Tarea 2.
- [ ] **VERIFICACIÓN DE FASE 1:** Ejecutar `yarn build` para asegurar que los nuevos servicios y helpers compilan correctamente.

## Fase 2: Evolución del Sistema de Decoradores

*Esta fase es el corazón del cambio, haciendo los decoradores "mágicos" y declarativos.*

- [ ] **Tarea 6: Re-implementar el decorador `@EmitsEvent`.**
  - **Descripción:** Añadir la "magia". El decorador debe contener la lógica `try/catch`, usar el `EventMetadataHelper` refactorizado para obtener el contexto, y emitir los eventos de éxito/fallo automáticamente. También debe registrar la información en el `SagaRegistryService`.
  - **Archivo a modificar:** `src/saga-event-module/common/decorators/emits-event.decorator.ts`
  - **Dependencias:** Tarea 3, Tarea 4.

- [ ] **Tarea 7: Crear Decoradores de Parámetros.**
  - **Descripción:** Implementar los nuevos decoradores `@CausationEvent` y `@EventMetadata` usando `ReflectMetadata` para que `@EmitsEvent` pueda localizar el contexto de la saga.
  - **Archivos a crear:**
    - `src/saga-event-module/common/decorators/causation-event.decorator.ts`
    - `src/saga-event-module/common/decorators/event-metadata.decorator.ts`
  - **Dependencias:** Tarea 6 (conceptualmente).

- [ ] **Tarea 8: Adaptar el decorador `@OnEventDoc`.**
  - **Descripción:** Modificar el decorador existente para que registre la información del listener en el nuevo `SagaRegistryService`.
  - **Archivo a modificar:** `src/saga-event-module/common/decorators/on-event-doc.decorator.ts`
  - **Dependencias:** Tarea 3.
- [ ] **VERIFICACIÓN DE FASE 2:** Ejecutar `yarn build` para asegurar que toda la nueva lógica de decoradores es válida.

## Fase 3: Adaptación y Ensamblaje del Módulo

- [ ] **Tarea 9: Adaptar el `EventLogService`.**
  - **Descripción:** Modificar el servicio para que use `@OnEventDoc` y cambie su estrategia de persistencia de Mongoose a un simple archivo `event-log.json` para esta PoC.
  - **Archivo a modificar:** `src/saga-event-module/modules/event-log/application/services/event-log.service.ts`
  - **Dependencias:** Tarea 8.

- [ ] **Tarea 10: Ensamblar el `SagaEventModule`.**
  - **Descripción:** Crear (o adaptar si existe) el archivo principal del módulo que importe, provea y exporte todos los componentes nuevos y refactorizados.
  - **Archivo a crear/modificar:** `src/saga-event-module/saga-event.module.ts`
  - **Dependencias:** Todas las tareas anteriores.
- [ ] **VERIFICACIÓN DE FASE 3:** Ejecutar `yarn build` para asegurar que el módulo ensamblado es coherente.

## Fase 4: Integración y Verificación

- [ ] **Tarea 11: Refactorizar la Aplicación de Prueba.**
  - **Descripción:** Modificar `AppModule`, `AppController` y `AppService` para usar la **nueva versión** del módulo, demostrando la emisión automática de eventos y la inyección de contexto sin `try/catch` ni propagación manual.
  - **Archivos a modificar:** `src/app.module.ts`, `src/app.controller.ts`, `src/app.service.ts`.
  - **Dependencias:** Tarea 10.
- [ ] **VERIFICACIÓN DE FASE 4:** Ejecutar `yarn build` para confirmar que la integración con la aplicación es correcta.

## Fase 5: Herramientas y Documentación

- [ ] **Tarea 12: Mejorar el Script de Generación de Documentos.**
  - **Descripción:** Modificar el comando `generate-event-types` (renombrarlo a `generate-docs`). Debe leer del `SagaRegistryService` para generar no solo los tipos, sino también el `EVENT_FLOW.md` (con grafo Mermaid.js) y el `EVENT_CATALOG.md`.
  - **Archivo a modificar:** `src/saga-event-module/commands/generate-event-types.command.ts`
  - **Dependencias:** Tarea 3, Tarea 11.
- [ ] **VERIFICACIÓN FINAL:** Ejecutar `yarn build` una última vez para asegurar que no se ha introducido ninguna regresión.
