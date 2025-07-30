# Blueprint de Implementación: Módulo de Sagas y Eventos

**Versión 3 (Autocontenida)**

Este documento es la única fuente de verdad para la construcción del `SagaEventModule`. Contiene todas las especificaciones, fragmentos de código de referencia y lógica necesaria.

## Fase 0: Prerrequisitos y Estructura

- [x] **Tarea 1: Instalar Dependencias.**
  - **Descripción:** Añadir las dependencias necesarias para el funcionamiento del módulo.
  - **Acción:** Ejecutar los siguientes comandos:
    ```bash
    yarn add @nestjs/event-emitter reflect-metadata
    yarn add nest-commander @golevelup/nestjs-discovery
    yarn add -D @types/node
    ```

- [x] **Tarea 2: Crear la Estructura de Directorios.**
  - **Descripción:** Crear la estructura de carpetas limpia y plana para el nuevo módulo.
  - **Acción:** Ejecutar el siguiente comando:
    ```bash
    mkdir -p src/saga-event-module/decorators src/saga-event-module/services src/saga-event-module/interfaces src/saga-event-module/commands src/saga-event-module/middleware
    ```

- [x] **VERIFICACIÓN DE FASE 0:** Ejecutar `yarn build` para asegurar que el setup inicial del proyecto es correcto.
- [x] **COMMIT DE FASE 0:** Crear un commit semántico en español.

---

## Fase 1: El Núcleo del Contexto y los Datos

- [x] **Tarea 3: Definir Interfaces Base.**
  - **Descripción:** Crear el archivo de interfaces que definirá la estructura de todos nuestros eventos.
  - **Archivo a crear:** `src/saga-event-module/interfaces/event.interfaces.ts`
  - **Contenido de Referencia:**
    ```typescript
    export interface Actor {
      readonly type: 'user' | 'system';
      readonly id: string;
      readonly details?: Record<string, any>;
    }

    export interface EventMetadata {
      readonly eventId: string;
      readonly correlationId: string;
      readonly causationId: string | null;
      readonly timestamp: Date;
      readonly actor: Actor;
    }

    export interface EventPayload<T> {
      metadata: EventMetadata;
      data: T;
    }
    ```

- [x] **Tarea 4: Implementar el `RequestContextService`.**
  - **Descripción:** Crear el servicio para la propagación de contexto implícito usando `AsyncLocalStorage`.
  - **Archivo a crear:** `src/saga-event-module/services/request-context.service.ts`
  - **Lógica Clave:**
    ```typescript
    import { Injectable } from '@nestjs/common';
    import { AsyncLocalStorage } from 'async_hooks';

    @Injectable()
    export class RequestContextService {
      private readonly als = new AsyncLocalStorage<Map<string, any>>();

      run(callback: () => void) {
        this.als.run(new Map(), callback);
      }

      set<T>(key: string, value: T) {
        const store = this.als.getStore();
        if (store) {
          store.set(key, value);
        }
      }

      get<T>(key: string): T | undefined {
        const store = this.als.getStore();
        return store?.get(key) as T | undefined;
      }
    }
    ```

- [x] **Tarea 5: Implementar el `SagaRegistryService`.**
  - **Descripción:** Crear el servicio singleton que registrará la información de los decoradores para la generación de documentos.
  - **Archivo a crear:** `src/saga-event-module/services/saga-registry.service.ts`
  - **Lógica Clave:**
    ```typescript
    import { Injectable } from '@nestjs/common';

    // Interfaces para los datos que vamos a registrar
    export interface EmitterInfo { name: string; className: string; methodName: string; }
    export interface ListenerInfo { eventName: string; className: string; methodName: string; }

    @Injectable()
    export class SagaRegistryService {
      public readonly emitters = new Map<string, EmitterInfo>();
      public readonly listeners = new Map<string, ListenerInfo[]>();

      registerEmitter(info: EmitterInfo) {
        this.emitters.set(info.name, info);
      }

      registerListener(info: ListenerInfo) {
        const existing = this.listeners.get(info.eventName) || [];
        this.listeners.set(info.eventName, [...existing, info]);
      }
    }
    ```

- [x] **VERIFICACIÓN DE FASE 1:** Ejecutar `yarn build` para asegurar que los servicios base compilan.
- [x] **COMMIT DE FASE 1:** Crear un commit semántico en español.

---

## Fase 2: Creación y Propagación de Metadatos

- [x] **Tarea 6: Implementar el `EventMetadataHelper`.**
  - **Descripción:** Crear el servicio que centraliza la lógica de creación de metadatos, utilizando el `RequestContextService`.
  - **Archivo a crear:** `src/saga-event-module/services/event-metadata.helper.ts`
  - **Lógica Clave:**
    ```typescript
    // ... imports ...
    import { randomUUID } from 'crypto';
    import { RequestContextService } from './request-context.service';
    import { Actor, EventMetadata, EventPayload } from '../interfaces/event.interfaces';

    @Injectable()
    export class EventMetadataHelper {
      constructor(private readonly context: RequestContextService) {}

      createFromContext(): EventMetadata {
        const eventId = randomUUID();
        const actor = this.context.get<Actor>('actor');
        const correlationId = this.context.get<string>('correlationId') || eventId;
        return { eventId, correlationId, causationId: null, actor, timestamp: new Date() };
      }

      createFromPrevious(previous: EventMetadata): EventMetadata {
        return {
          eventId: randomUUID(),
          correlationId: previous.correlationId,
          causationId: previous.eventId,
          actor: previous.actor,
          timestamp: new Date(),
        };
      }
    }
    ```

- [x] **Tarea 7: Implementar el `RequestContextMiddleware`.**
  - **Descripción:** Crear el middleware que inicia el contexto en cada petición HTTP.
  - **Archivo a crear:** `src/saga-event-module/middleware/request-context.middleware.ts`
  - **Lógica Clave:**
    ```typescript
    // ... imports ...
    import { RequestContextService } from '../services/request-context.service';
    import { randomUUID } from 'crypto';

    @Injectable()
    export class RequestContextMiddleware implements NestMiddleware {
      constructor(private readonly contextService: RequestContextService) {}
      use(req: Request, res: Response, next: NextFunction) {
        this.contextService.run(() => {
          // Simular la obtención del actor (en una app real vendría de un token JWT)
          const actor = { id: req.headers['x-user-id'] || 'system', type: 'user' };
          this.contextService.set('actor', actor);
          this.contextService.set('correlationId', req.headers['x-correlation-id'] || randomUUID());
          next();
        });
      }
    }
    ```

- [x] **VERIFICACIÓN DE FASE 2:** Ejecutar `yarn build`.
- [x] **COMMIT DE FASE 2:** Crear un commit semántico en español.

---

## Fase 3: El Sistema de Decoradores

- [x] **Tarea 8: Implementar Decoradores de Parámetros.**
  - **Descripción:** Crear los decoradores `@CausationEvent` y `@EventMetadata` que solo adjuntan metadatos de la posición del parámetro.
  - **Archivos a crear:** `causation-event.decorator.ts`, `event-metadata.decorator.ts` en `decorators/`.
  - **Lógica Clave (`CausationEvent`):**
    ```typescript
    import 'reflect-metadata';
    export const CAUSATION_EVENT_PARAM_INDEX = Symbol('CausationEventParamIndex');
    export const CausationEvent = (): ParameterDecorator => {
      return (target, propertyKey, parameterIndex) => {
        Reflect.defineMetadata(CAUSATION_EVENT_PARAM_INDEX, parameterIndex, target, propertyKey);
      };
    };
    ```

- [x] **Tarea 9: Implementar `@OnEventDoc`.**
  - **Descripción:** Crear el decorador que envuelve a `@OnEvent` y registra al listener.
  - **Archivo a crear:** `src/saga-event-module/decorators/on-event-doc.decorator.ts`
  - **Lógica Clave:**
    ```typescript
    // ... imports ...
    import { OnEvent } from '@nestjs/event-emitter';
    import { SagaRegistryService } from '../services/saga-registry.service';

    export const OnEventDoc = (eventName: string, ...): MethodDecorator => {
      return (target, propertyKey, descriptor) => {
        // 1. Registrar en SagaRegistryService (requiere acceso al servicio, puede necesitar inyección en el decorador o un enfoque estático)
        // 2. Llamar a OnEvent(eventName)(target, propertyKey, descriptor)
      };
    };
    ```

- [x] **Tarea 10: Implementar `@EmitsEvent` (el decorador "mágico").**
  - **Descripción:** Crear el decorador principal que automatiza el `try/catch` y la emisión de eventos.
  - **Archivo a crear:** `src/saga-event-module/decorators/emits-event.decorator.ts`
  - **Lógica Clave (Pseudo-código):**
    ```typescript
    // ...
    descriptor.value = async function (...args: any[]) {
      // 1. Obtener instancias de EventMetadataHelper, EventEmitter, SagaRegistryService desde 'this'.
      // 2. Usar Reflect.getMetadata para ver si hay un parámetro @CausationEvent.
      const causationIndex = Reflect.getMetadata(CAUSATION_EVENT_PARAM_INDEX, ...);
      let metadata;
      if (causationIndex !== undefined) {
        const causationPayload = args[causationIndex];
        metadata = helper.createFromPrevious(causationPayload.metadata);
      } else {
        metadata = helper.createFromContext();
      }
      // 3. Envolver originalMethod.apply(this, args) en un try/catch.
      // 4. On success: construir payload de éxito y emitir evento options.onSuccess.name.
      // 5. On failure: construir payload de fallo y emitir evento options.onFailure.name.
      // 6. Registrar los eventos emitidos en SagaRegistryService.
    }
    ```

- [x] **VERIFICACIÓN DE FASE 3:** Ejecutar `yarn build`.
- [x] **COMMIT DE FASE 3:** Crear un commit semántico en español.

---

## Fase 4: Auditoría y Ensamblaje

- [x] **Tarea 11: Implementar `EventLogService`.**
  - **Descripción:** Crear el servicio que escucha todos los eventos y los persiste en `event-log.json`.
  - **Archivo a crear:** `src/saga-event-module/services/event-log.service.ts`
  - **Lógica Clave:**
    ```typescript
    // ... imports ...
    import { OnEvent } from '@nestjs/event-emitter';
    import { appendFile } from 'fs/promises';

    @Injectable()
    export class EventLogService {
      @OnEvent('**', { async: true })
      async handleAllEvents(eventName: string, payload: EventPayload<any>) {
        // ... lógica para asegurar que el payload tiene metadata ...
        const logEntry = { timestamp: new Date().toISOString(), eventName, ...payload };
        await appendFile('event-log.json', JSON.stringify(logEntry) + '\n');
      }
    }
    ```

- [x] **Tarea 12: Ensamblar el `SagaEventModule`.**
  - **Descripción:** Crear el módulo principal que une todos los componentes.
  - **Archivo a crear:** `src/saga-event-module/saga-event.module.ts`
  - **Lógica Clave:**
    ```typescript
    // ... imports ...
    @Global()
    @Module({
      imports: [EventEmitterModule.forRoot()],
      providers: [
        RequestContextService,
        SagaRegistryService,
        EventMetadataHelper,
        EventLogService,
        TypedEventEmitter, // Wrapper tipado
      ],
      exports: [/* ... todos los providers ... */],
    })
    export class SagaEventModule implements NestModule {
      configure(consumer: MiddlewareConsumer) {
        consumer.apply(RequestContextMiddleware).forRoutes('*');
      }
    }
    ```

- [x] **VERIFICACIÓN DE FASE 4:** Ejecutar `yarn build`.
- [x] **COMMIT DE FASE 4:** Crear un commit semántico en español.

---

## Fase 5: Herramientas y Documentación

- [x] **Tarea 13: Implementar el Generador de Documentación.**
  - **Descripción:** Crear el comando `generate-docs` que lee del `SagaRegistryService` para generar los artefactos.
  - **Archivo a crear:** `src/saga-event-module/commands/generate-docs.command.ts`
  - **Lógica Clave:**
    1.  Inyectar `SagaRegistryService`.
    2.  Leer `registry.emitters` y `registry.listeners`.
    3.  Generar `generated-events.ts` con los nombres de eventos.
    4.  Generar `EVENT_CATALOG.md` con una tabla de eventos, quién emite y quién escucha.
    5.  Generar `EVENT_FLOW.md` con la sintaxis de Mermaid.js.
      ```mermaid
      graph LR;
          UserService.createUser -- Emits --> user.creation.success;
          user.creation.success -- Triggers --> NotificationService.sendWelcomeEmail;
      ```

- [x] **VERIFICACIÓN FINAL:** Ejecutar `yarn build`.
- [x] **COMMIT FINAL:** Crear un commit semántico en español.