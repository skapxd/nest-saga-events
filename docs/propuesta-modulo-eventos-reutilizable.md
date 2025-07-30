# Propuesta de Diseño: Módulo Reutilizable de Eventos y Sagas

-   **Estado:** 📝 Borrador
-   **Fecha:** 📅 2025-07-29
-   **Propósito:** Extraer la arquitectura de eventos, el manejo de sagas coreografiadas y las utilidades de trazabilidad del proyecto actual en un **módulo NestJS reutilizable**. El objetivo es estandarizar y acelerar el desarrollo de sistemas asíncronos y desacoplados.

## 1. Resumen

El sistema actual ha desarrollado un robusto patrón para la gestión de flujos de trabajo asíncronos utilizando un bus de eventos, decoradores para la captura de metadatos, y un sistema de persistencia para la auditoría. Este documento propone formalizar estos componentes en un único módulo (`SagaEventModule`) que encapsule toda la lógica de base, permitiendo a los desarrolladores centrarse en la lógica de negocio.

## 2. Conceptos Clave

El módulo se basará en los siguientes principios y patrones ya establecidos en el proyecto:

1.  **Arquitectura Orientada a Eventos (EDA):** La comunicación entre componentes se realiza de forma asíncrona a través de un bus de eventos, desacoplando la lógica de negocio.
2.  **Saga (Coreografía):** Para operaciones complejas que involucran múltiples pasos, se utiliza el patrón Saga en su modalidad de coreografía. Cada servicio reacciona a eventos emitidos por otros servicios, sin un orquestador central.
3.  **Metadatos y Correlación:** Cada evento lleva metadatos (`correlationId`, `causationId`, `actor`) que permiten una trazabilidad completa de la cadena de eventos que conforman una saga.
4.  **Persistencia y Auditoría:** Todos los eventos emitidos son persistidos automáticamente en un log inmutable, sirviendo como la fuente de verdad y facilitando la depuración y auditoría.
5.  **Definición Declarativa:** Se utilizan decoradores para declarar qué métodos emiten eventos y cuáles los escuchan, manteniendo la lógica de negocio limpia y legible.

## 3. Componentes del Módulo Reutilizable

El módulo `@unibank/saga-event` (nombre hipotético) contendrá los siguientes componentes extraídos y adaptados del código fuente actual:

| Componente | Archivo(s) de Origen | Descripción |
| :--- | :--- | :--- |
| **`SagaEventModule`** | `main.module.ts` | Módulo principal que importará `EventEmitterModule.forRoot()` y registrará los proveedores globales. |
| **`TypedEventEmitter`** | `src/common/typed-event-emitter.service.ts` | Un wrapper sobre `EventEmitter2` que proporciona tipado fuerte para los payloads de eventos, mejorando la seguridad y el autocompletado. |
| **`EventMetadataHelper`** | `src/common/helpers/event-metadata/` | Servicio para crear y propagar los metadatos de trazabilidad (`EventMetadata`) a través de una saga. |
| **Decoradores** | `src/common/decorators/` | - **`@EmitsEvent`**: Declara que un método emite eventos de éxito y/o fallo. Será la fuente de verdad para la generación automática de tipos.<br>- **`@OnEventDoc`**: Un wrapper sobre `@OnEvent` que captura metadatos para la documentación automática. |
| **`EventLogService`** | `src/modules/event-log/` | Un servicio con un listener wildcard (`@OnEvent('*')`) que captura y persiste **todos** los eventos emitidos en la aplicación de forma automática. |
| **`BaseEventPayload`** | `src/common/events/base-event-payload.ts` | Una clase base que estandariza la estructura de todos los payloads de eventos, conteniendo `metadata` y `data`. |
| **Generador de Tipos** | `src/commands/generate-event-types.command.ts` | Un comando de `nest-commander` que se ejecutará para escanear el código en busca de decoradores `@EmitsEvent` y generar un archivo `generated-events.ts` con todos los tipos y definiciones. |
| **Filtro de Excepciones** | `src/common/filters/http-exception.filter.ts` | Un filtro global de excepciones para estandarizar las respuestas de error de la API. |

## 4. Modo de Uso (Guía para el Desarrollador)

Una vez empaquetado, el uso del módulo en un nuevo proyecto sería el siguiente:

### Paso 1: Instalar e Importar el Módulo

```bash
yarn add @unibank/saga-event-module
```

En el `app.module.ts` del nuevo proyecto, se importaría el módulo. Se podría configurar para habilitar/deshabilitar la persistencia de eventos.

```typescript
// app.module.ts
import { Module } from '@nestjs/common';
import { SagaEventModule } from '@unibank/saga-event-module';

@Module({
  imports: [
    SagaEventModule.forRoot({
      persistEvents: true, // Habilita el EventLogService
    }),
    // ... otros módulos de la aplicación
  ],
})
export class AppModule {}
```

### Paso 2: Definir y Emitir Eventos

La definición de un evento es implícita y declarativa. El desarrollador solo necesita:
1.  Crear una clase DTO para el payload del evento.
2.  Usar el decorador `@EmitsEvent` en el método del servicio que inicia la acción.

```typescript
// src/modules/users/application/services/user.service.ts
import { EmitsEvent } from '@unibank/saga-event-module';
import { UserCreationSuccessPayload, UserCreationFailurePayload } from '../../events/user.events';

@Injectable()
export class UserService {
  constructor(
    private readonly eventEmitter: TypedEventEmitter,
    private readonly eventMetadataHelper: EventMetadataHelper,
  ) {}

  @EmitsEvent({
    onSuccess: {
      name: 'user.creation.success',
      description: 'Se emite cuando un usuario se crea exitosamente.',
      payload: UserCreationSuccessPayload,
    },
    onFailure: {
      name: 'user.creation.failed',
      description: 'Se emite si la creación del usuario falla.',
      payload: UserCreationFailurePayload,
    },
  })
  async createUser(userData: CreateUserDto, actor: Actor) {
    const metadata = this.eventMetadataHelper.create(actor); // Crea metadata inicial

    try {
      const user = await this.userRepository.create(userData);
      
      const successPayload = this.eventMetadataHelper.createPayload(
        { user },
        actor,
        { metadata } // Propaga la metadata inicial
      );
      this.eventEmitter.emit('user.creation.success', successPayload);
      
      return user;
    } catch (error) {
      const failurePayload = this.eventMetadataHelper.createPayload(
        { error },
        actor,
        { metadata }
      );
      this.eventEmitter.emit('user.creation.failed', failurePayload);
      throw error;
    }
  }
}
```

### Paso 3: Escuchar Eventos para Continuar la Saga

Otro servicio puede escuchar el evento de éxito para realizar una acción secundaria, como enviar un email de bienvenida.

```typescript
// src/modules/notifications/application/services/notification.service.ts
import { OnEventDoc } from '@unibank/saga-event-module';
import { AppEvents } from '#/src/common/events'; // Apunta a los eventos generados

@Injectable()
export class NotificationService {

  @OnEventDoc(AppEvents.USER_CREATION_SUCCESS)
  async handleUserCreation(payload: EventPayload<UserCreationSuccessPayload>) {
    // Lógica para enviar email de bienvenida
    // payload.data.user contiene los datos del usuario creado
    // payload.metadata contiene toda la información de trazabilidad
  }
}
```

### Paso 4: Generar Tipos

El desarrollador ejecutaría un comando proporcionado por el módulo para mantener los tipos actualizados.

```bash
yarn nest generate-event-types
```

Esto escanearía todos los decoradores `@EmitsEvent` y generaría el archivo `generated-events.ts`, proporcionando autocompletado y seguridad de tipos en todo el proyecto.

## 5. Beneficios Clave

-   **Reutilización y Consistencia:** Asegura que todos los proyectos sigan los mismos patrones de EDA y sagas.
-   **Reducción de Boilerplate:** Los desarrolladores no necesitan re-implementar la lógica de trazabilidad, persistencia o tipado.
-   **Trazabilidad Automática:** La propagación de `correlationId` y `causationId` se simplifica a través del `EventMetadataHelper`.
-   **Auditoría "Gratuita":** Todos los eventos se guardan automáticamente si el módulo está configurado para ello, proporcionando un log de auditoría completo sin esfuerzo adicional.
-   **Documentación Viva:** El sistema de decoradores permite generar documentación de flujos de eventos que siempre está sincronizada con el código.

## 6. Plan de Extracción (Accionables)

1.  **Crear Repositorio:** Inicializar un nuevo repositorio para el paquete `@unibank/saga-event-module`.
2.  **Copiar y Generalizar Componentes:**
    -   Mover los archivos de los componentes listados en la sección 3 al nuevo proyecto.
    -   Refactorizarlos para eliminar dependencias específicas del proyecto "Vivienda Unibank". Por ejemplo, el `EventLogRepository` no debe depender de una entidad Mongoose específica, sino quizás de una interfaz y una implementación configurable.
3.  **Empaquetar y Publicar:** Configurar `package.json` y publicar el módulo en un registro privado (ej. GitHub Packages, Artifactory).
4.  **Refactorizar Proyecto Original:**
    -   Eliminar los archivos originales que fueron movidos al módulo.
    -   Añadir el nuevo paquete como una dependencia en `package.json`.
    -   Actualizar las importaciones para que apunten al nuevo módulo (`@unibank/saga-event-module`).
5.  **Verificación:** Ejecutar todas las pruebas (`yarn test`, `yarn build`) para asegurar que la refactorización no ha introducido regresiones.
