# Diseño de Arquitectura: Módulo Reutilizable de Sagas y Eventos

-   **Estado:** 📝 Propuesta Detallada
-   **Fecha:** 📅 2025-07-29
-   **Autores:** Manuel Meneses, Asistente AI (Gemini)

## 1. Resumen Ejecutivo

Este documento describe la arquitectura de un módulo NestJS reutilizable, `SagaEventModule`, diseñado para estandarizar y simplificar la implementación de sistemas asíncronos basados en eventos y el patrón Saga (coreografía).

El objetivo principal es **eliminar el código repetitivo (boilerplate)** y los errores humanos asociados a la gestión de eventos, la propagación de metadatos de trazabilidad y la lógica de `try/catch`. La solución se centra en un sistema de **decoradores "mágicos" pero declarativos** que automatizan estas tareas, permitiendo a los desarrolladores centrarse exclusivamente en la lógica de negocio.

## 2. Principios de Diseño Clave

-   **Experiencia de Desarrollador (DX) Superior:** La API del módulo debe ser intuitiva, explícita y sentirse nativa del ecosistema NestJS. Se prioriza reducir la carga cognitiva del desarrollador.
-   **Magia Controlada y Explícita:** El módulo ocultará la complejidad, pero lo hará de una manera predecible y declarativa. No habrá "magia" que no pueda ser entendida leyendo las firmas de los decoradores.
-   **Trazabilidad de Extremo a Extremo como Requisito:** Cada acción dentro del sistema debe ser rastreable a través de un `correlationId` único y un `causationId` que encadene los eventos, originados por un `actor` específico. Esta funcionalidad será automática y no opcional.
-   **Cero "Prop Drilling" Manual:** La propagación de metadatos de trazabilidad no será responsabilidad del desarrollador. El módulo se encargará de ello de forma transparente.

## 3. Arquitectura Detallada de Componentes

El módulo se construirá de forma autocontenida dentro de `src/saga-event-module` para esta prueba de concepto.

### 3.1. `RequestContextService`

-   **Propósito:** Encapsular y gestionar el contexto de una transacción única utilizando `AsyncLocalStorage` de Node.js.
-   **Implementación:**
    -   Contendrá una instancia privada de `AsyncLocalStorage`.
    -   Expondrá un método `run(callback)` que crea la "burbuja" de contexto para una petición HTTP, un job, etc.
    -   Expondrá métodos `set(key, value)` y `get(key)` para manipular los datos dentro del contexto actual.
-   **Uso:** Será utilizado por un middleware global para establecer el contexto al inicio de cada petición HTTP.

### 3.2. `EventMetadataHelper`

-   **Propósito:** Servir como la única fuente de verdad para la creación y propagación de `EventMetadata`.
-   **Implementación:**
    -   Inyectará el `RequestContextService`.
    -   **`createFromContext()`:** Creará la metadata inicial para el primer paso de una saga, extrayendo el `actor` y `correlationId` del `RequestContextService`.
    -   **`createFromPrevious(previousMetadata)`:** Creará la metadata para un paso subsiguiente de la saga, recibiendo la metadata del evento anterior. Copiará el `correlationId` y el `actor`, y establecerá el `causationId` con el ID del evento anterior.

### 3.3. El Sistema de Decoradores

Este es el núcleo de la interacción del desarrollador con el módulo.

#### 3.3.1. Decorador de Método: `@EmitsEvent(options)`

-   **Propósito:** Declarar que un método emite eventos y automatizar su emisión.
-   **Firma:**
    ```typescript
    interface EventInfo {
      name: string;
      description?: string;
      payload: new (...args: any[]) => any;
    }

    interface EmitsEventOptions {
      onSuccess: EventInfo;
      onFailure?: EventInfo;
    }

    function EmitsEvent(options: EmitsEventOptions): MethodDecorator;
    ```
-   **Comportamiento ("Magia"):**
    1.  Envuelve el método original en un bloque `try/catch`.
    2.  Antes de ejecutar, determina la metadata correcta (ver sección 3.3.2 y 3.3.3).
    3.  **En caso de éxito:** Llama a `eventEmitter.emit()` con el `name` y `payload` definidos en `onSuccess`. El resultado del método original se empaqueta dentro del `data` del payload.
    4.  **En caso de excepción:** Llama a `eventEmitter.emit()` con los datos de `onFailure`. El `error` capturado se empaqueta en el `data` del payload.
    5.  Toda la lógica de creación de `EventPayload` y llamada a `eventEmitter` está oculta al desarrollador.

#### 3.3.3. Decorador de Método: `@OnEventDoc(eventName, options)`

-   **Propósito:** Reemplazar el `@OnEvent` de NestJS para no solo suscribir un método a un evento, sino también para registrar esta relación, permitiendo la generación de documentación y grafos de flujo.
-   **Firma:**
    ```typescript
    interface OnEventDocOptions {
      description?: string;
    }

    function OnEventDoc(eventName: string, options?: OnEventDocOptions): MethodDecorator;
    ```
-   **Comportamiento:**
    1.  Internamente, llama al decorador `@OnEvent(eventName)` de `@nestjs/event-emitter` para asegurar la funcionalidad de suscripción.
    2.  Utiliza `Reflect.defineMetadata` para registrar en un `SagaRegistryService` global que la clase y método actuales están escuchando a `eventName`, junto con la `description` proporcionada.

#### 3.3.4. Decorador de Parámetro: `@CausationEvent()`

-   **Propósito:** Marcar explícitamente qué parámetro de un método listener contiene el `EventPayload` del evento que lo causó.
-   **Comportamiento:**
    -   No tiene lógica propia. Su única función es adjuntar metadatos (`Reflect.defineMetadata`) al método, indicando la posición del parámetro que es el evento causante. El decorador `@EmitsEvent` leerá estos metadatos para saber de dónde extraer la metadata a propagar.

#### 3.3.5. Decorador de Parámetro: `@EventMetadata()`

-   **Propósito:** Inyectar el objeto `EventMetadata` directamente en un parámetro del método para que el desarrollador pueda usarlo si lo necesita.
-   **Comportamiento:**
    -   Similar a `@CausationEvent`, marca un parámetro.
    -   El decorador `@EmitsEvent` identificará este parámetro y, después de calcular la metadata para el paso actual, la inyectará en este argumento antes de llamar al método original.

### 3.4. `EventLogService`

-   **Propósito:** Proporcionar un log de auditoría completo de todos los eventos que ocurren en el sistema.
-   **Implementación:**
    -   Contendrá un único listener wildcard: `@OnEvent('*', { async: true })`.
    -   Al recibir un evento, lo escribirá en un archivo `event-log.json`. Cada evento se añadirá a una nueva línea para simular un log inmutable.
    -   Esto simula una persistencia real en una base de datos sin la complejidad de configurar una para este prototipo.

### 3.5. Interfaces y DTOs Base

-   Se definirán estructuras de datos clave en archivos compartidos:
    -   `Actor`: `{ id: string; type: 'user' | 'system'; details?: Record<string, any> }`
    -   `EventMetadata`: `{ eventId: string; correlationId: string; causationId: string | null; timestamp: Date; actor: Actor }`
    -   `EventPayload<T>`: `{ data: T; metadata: EventMetadata }`

## 4. Flujo de Trabajo del Desarrollador (Modo de Uso)

### Paso 1: Iniciar una Saga (desde un Controlador HTTP)

El desarrollador no necesita hacer nada especial. Un middleware global configurado por el módulo se encarga de todo.

```typescript
// src/modules/users/user.controller.ts
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  async createUser(@Body() body: CreateUserDto) {
    // La firma del método está limpia. No hay parámetros de metadata.
    // El middleware ya pobló AsyncLocalStorage.
    return this.userService.createUser(body);
  }
}

// src/modules/users/user.service.ts
@Injectable()
export class UserService {
  
  @EmitsEvent({
    onSuccess: { name: 'user.creation.success', payload: UserCreationSuccessPayload },
    onFailure: { name: 'user.creation.failed', payload: UserCreationFailurePayload },
  })
  async createUser(data: CreateUserDto) {
    // Lógica de negocio pura.
    // No hay try/catch, no hay eventEmitter.emit.
    // El decorador se encarga de todo.
    const user = await this.userRepository.create(data);
    return { user }; // Este será el `data` del payload de éxito.
  }
}
```

### Paso 2: Continuar la Saga (desde un Listener de Eventos)

Otro servicio escucha el evento de éxito y continúa la saga.

```typescript
// src/modules/notifications/notification.service.ts
@Injectable()
export class NotificationService {

  @OnEvent('user.creation.success')
  @EmitsEvent({
    onSuccess: { name: 'notification.welcome_email.sent', payload: EmailSentPayload },
  })
  async sendWelcomeEmail(
    // El desarrollador declara explícitamente sus dependencias de contexto:
    @CausationEvent() event: EventPayload<UserCreationSuccessPayload>,
    @EventMetadata() metadata: EventMetadata,
  ) {
    // El código es limpio, tipado y explícito.
    console.log(`Continuando saga con correlationId: ${metadata.correlationId}`);
    
    const userEmail = event.data.user.email;
    // ...lógica para enviar el email.
    
    return { messageId: 'xyz-123' }; // `data` para el evento 'notification.welcome_email.sent'
  }
}
```

## 5. Generación de Artefactos (Tipos y Documentación)

Para evitar la complejidad de manipular el AST de TypeScript, se seguirá un enfoque basado en un registro en memoria (`SagaRegistryService`).

1.  **Registro Global (`SagaRegistryService`):** Se creará un provider global que actúe como un registro.
2.  **Poblado por Decoradores:** Cada vez que los decoradores `@EmitsEvent` y `@OnEventDoc` se inicialicen en la aplicación, registrarán su información (nombres de eventos, payloads, clases, métodos, descripciones) en el `SagaRegistryService`.
3.  **Script de Generación (`yarn nest generate-docs`):** Se creará un comando de NestJS. Este script arrancará una instancia "seca" de la aplicación para poblar el registro, y luego leerá su contenido para generar los siguientes artefactos:
    -   **`generated-events.ts`**: Un archivo que exporta un objeto o enum con todos los nombres de eventos, proporcionando autocompletado y una fuente única de verdad para los nombres de eventos.
    -   **`EVENT_FLOW.md`**: Un documento Markdown que contiene un grafo del flujo de la saga en formato **Mermaid.js**. Esto permite que el grafo se renderice directamente en visores de Markdown como GitHub, proporcionando una documentación visual accesible sin necesidad de herramientas externas.
    -   **`EVENT_CATALOG.md`**: Un documento Markdown que sirve como un catálogo de eventos, detallando la descripción de cada uno, quién lo emite y quién lo escucha.

## 6. Plan de Implementación (Prueba de Concepto)

1.  Crear la estructura de directorios: `src/saga-event-module`.
2.  Definir las interfaces y DTOs base.
3.  Implementar `RequestContextService` y el middleware global.
4.  Implementar `EventMetadataHelper`.
5.  Implementar el sistema de decoradores (`@EmitsEvent`, `@CausationEvent`, `@EventMetadata`) usando `ReflectMetadata`.
6.  Implementar `EventLogService` con persistencia en un archivo JSON.
7.  Refactorizar `AppModule`, `AppController` y `AppService` para usar el nuevo módulo y probar el flujo de extremo a extremo.
8.  Crear el script de generación de tipos.
