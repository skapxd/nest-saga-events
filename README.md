<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

<h1 align="center">SagaEventModule: Un Framework para Sagas Coreografiadas en NestJS</h1>

<p align="center">
  <strong>Estado:</strong> Prueba de Concepto 🧪
</p>

## Resumen

Este repositorio es una prueba de concepto para un **módulo NestJS reutilizable (`SagaEventModule`)** diseñado para estandarizar y simplificar la implementación de sistemas asíncronos basados en eventos y el patrón **Saga (Coreografía)**.

El objetivo principal es **eliminar el código repetitivo (boilerplate)** y los errores comunes asociados a la gestión de eventos, la propagación de metadatos de trazabilidad y la lógica de `try/catch`. La solución se centra en un sistema de **decoradores "mágicos" pero declarativos** que automatizan estas tareas, permitiendo a los desarrolladores centrarse exclusivamente en la lógica de negocio.

## El Problema: La Complejidad de los Sistemas Asíncronos

Construir sistemas robustos y mantenibles basados en eventos es complejo. Los desarrolladores a menudo enfrentan los siguientes desafíos:

- **Código Repetitivo:** Escribir bloques `try/catch` para manejar éxitos y fallos en cada método que inicia una operación asíncrona.
- **Emisión Manual de Eventos:** Acordarse de emitir los eventos correctos (`operation.success`, `operation.failure`) en cada rama del código.
- **Pérdida de Trazabilidad:** Propagar manualmente IDs de correlación y causalidad a través de múltiples servicios y eventos es tedioso y propenso a errores.
- **Documentación Desactualizada:** Mantener diagramas y catálogos de eventos sincronizados con un código que evoluciona constantemente es una tarea casi imposible.

## La Solución: Un Framework Declarativo y Automatizado

El `SagaEventModule` aborda estos problemas proveyendo un conjunto de herramientas que automatizan las tareas repetitivas y garantizan la consistencia.

### Principios de Diseño

- **Experiencia de Desarrollador (DX) Superior:** Una API intuitiva y explícita que se siente nativa del ecosistema NestJS.
- **Magia Controlada:** El módulo oculta la complejidad, pero lo hace de una manera predecible y declarativa.
- **Trazabilidad por Defecto:** Cada acción es rastreable de extremo a extremo a través de un `correlationId` y un `causationId`.
- **Arquitectura Viva:** La documentación y los tipos se generan automáticamente a partir del código fuente, asegurando que siempre estén actualizados.

## Componentes Clave

- **`@EmitsEvent(options)`**: El decorador principal. Envuelve un método y, de forma automática, emite eventos de éxito o fallo basándose en el resultado de la ejecución (si retorna un valor o lanza una excepción).
- **`@OnEventDoc(eventName)`**: Un reemplazo para el `@OnEvent` de NestJS que, además de suscribir un método a un evento, registra la relación para la generación de documentación.
- **`@CausationEvent()`**: Un decorador de parámetro que marca cuál es el evento entrante que causó la ejecución del método actual, permitiendo al sistema propagar la cadena de trazabilidad.
- **`EventLogService`**: Un servicio que escucha todos los eventos (`*`) y los persiste en un log (`event-log.json`), proporcionando una auditoría completa sin esfuerzo adicional.
- **Generadores Automáticos**:
  - `EventGeneratorService`: Genera los tipos de todos los eventos de la aplicación en `src/saga-event-module/types/generated-events.ts`.
  - `EventDocumentationService`: Genera un catálogo de eventos y un grafo de flujo visual en formato Mermaid.

## Cómo Funciona: Un Vistazo Rápido

#### 1. Emitir un Evento (El Inicio de la Saga)

El desarrollador solo necesita decorar el método. No hay `try/catch`, no hay `eventEmitter.emit`.

```typescript
// src/user/user.service.ts
@Injectable()
export class UserService {
  // ...
  @EmitsEvent({
    onInit: { name: 'user.creation.init' },
    onSuccess: { name: 'user.created.success' },
    onFailure: { name: 'user.created.failure' },
  })
  createUser(createUserDto: CreateUserDto) {
    this.logger.log('Attempting to create user:', createUserDto);

    if (Math.random() < 0.5) {
      throw new Error('Random failure during user creation');
    }

    const user = { id: '12345', ...createUserDto };
    return user; // Este valor será el payload del evento de éxito.
  }
}
```

#### 2. Escuchar un Evento (La Continuación de la Saga)

Otro servicio reacciona al evento emitido. El decorador `@CausationEvent` permite obtener la metadata del evento anterior para mantener la trazabilidad.

```typescript
// src/notifications/notification.service.ts
@Injectable()
export class NotificationService {
  // ...
  @OnEventDoc('user.created.success')
  handleUserCreatedSuccess(
    @CausationEvent()
    payload: EventPayload<{ id: string; name: string; email: string }>,
  ) {
    this.logger.log(`Sending welcome email to ${payload.data.name}`);
    this.logger.log('Correlation ID:', payload.metadata.correlationId);
  }
}
```

## Artefactos Auto-Generados

Al iniciar la aplicación, el módulo genera automáticamente:

1.  **Catálogo de Eventos (`docs/generated/EVENT_CATALOG.md`)**: Un archivo Markdown que documenta cada evento, quién lo emite y quién lo escucha.
2.  **Grafo de Flujo de Eventos (`docs/generated/EVENT_FLOW.md`)**: Un diagrama en formato Mermaid que visualiza la coreografía completa de la saga.
3.  **Endpoint de Visualización**: El diagrama de flujo también está disponible en `http://localhost:3000/event-docs/flow` para ser consumido por un frontend.

### Ejemplo de Grafo de Flujo

El siguiente diagrama es generado automáticamente y muestra las relaciones entre los servicios `UserService` y `NotificationService`:

```mermaid
graph TD;

    N0_UserService_createUser["UserService.createUser"]
    N0_UserService_createUser["UserService.createUser"]
    N0_UserService_createUser["UserService.createUser"]
    N1_OrderService_placeOrder["OrderService.placeOrder"]
    N1_OrderService_placeOrder["OrderService.placeOrder"]
    N1_OrderService_placeOrder["OrderService.placeOrder"]
    N2_InventoryService_handleOrderPlacement["InventoryService.handleOrderPlacement"]
    N2_InventoryService_handleOrderPlacement["InventoryService.handleOrderPlacement"]
    N3_PaymentService_handleInventoryReserved["PaymentService.handleInventoryReserved"]
    N3_PaymentService_handleInventoryReserved["PaymentService.handleInventoryReserved"]
    N4_NotificationService_handleUserCreatedSuccess["NotificationService.handleUserCreatedSuccess"]
    N5_NotificationService_handleUserCreatedFailure["NotificationService.handleUserCreatedFailure"]
    N6_NotificationService_handleOrderConfirmed["NotificationService.handleOrderConfirmed"]
    N7_NotificationService_handleInventoryFailure["NotificationService.handleInventoryFailure"]
    N8_NotificationService_handlePaymentFailure["NotificationService.handlePaymentFailure"]
    N2_InventoryService_handleOrderPlacement["InventoryService.handleOrderPlacement"]
    N9_InventoryService_handlePaymentFailure["InventoryService.handlePaymentFailure"]
    N3_PaymentService_handleInventoryReserved["PaymentService.handleInventoryReserved"]
    N10_user_creation_init("user.creation.init")
    N11_user_created_success("user.created.success")
    N12_user_created_failure("user.created.failure")
    N13_order_placement_init("order.placement.init")
    N14_order_confirmed_success("order.confirmed.success")
    N15_order_placement_failed("order.placement.failed")
    N16_inventory_reserved_success("inventory.reserved.success")
    N17_inventory_reserved_failure("inventory.reserved.failure")
    N18_payment_processed_success("payment.processed.success")
    N19_payment_processed_failure("payment.processed.failure")

    N0_UserService_createUser -- Emits --> N10_user_creation_init
    N0_UserService_createUser -- Emits --> N11_user_created_success
    N0_UserService_createUser -- Emits --> N12_user_created_failure
    N1_OrderService_placeOrder -- Emits --> N13_order_placement_init
    N1_OrderService_placeOrder -- Emits --> N14_order_confirmed_success
    N1_OrderService_placeOrder -- Emits --> N15_order_placement_failed
    N2_InventoryService_handleOrderPlacement -- Emits --> N16_inventory_reserved_success
    N2_InventoryService_handleOrderPlacement -- Emits --> N17_inventory_reserved_failure
    N3_PaymentService_handleInventoryReserved -- Emits --> N18_payment_processed_success
    N3_PaymentService_handleInventoryReserved -- Emits --> N19_payment_processed_failure
    N11_user_created_success -- Triggers --> N4_NotificationService_handleUserCreatedSuccess
    N12_user_created_failure -- Triggers --> N5_NotificationService_handleUserCreatedFailure
    N14_order_confirmed_success -- Triggers --> N6_NotificationService_handleOrderConfirmed
    N17_inventory_reserved_failure -- Triggers --> N7_NotificationService_handleInventoryFailure
    N19_payment_processed_failure -- Triggers --> N8_NotificationService_handlePaymentFailure
    N13_order_placement_init -- Triggers --> N2_InventoryService_handleOrderPlacement
    N19_payment_processed_failure -- Triggers --> N9_InventoryService_handlePaymentFailure
    N16_inventory_reserved_success -- Triggers --> N3_PaymentService_handleInventoryReserved
```

## Instalación y Uso

```bash
# 1. Instalar dependencias
$ yarn install

# 2. Iniciar en modo de desarrollo
$ yarn start:dev
```

Al iniciar, los servicios de generación se ejecutarán y crearán los tipos y la documentación en los directorios `src/saga-event-module/types` y `docs/generated`.

## Pruebas Unitarias con SagaEventTestingModule

Cuando se escriben pruebas unitarias para servicios que utilizan decoradores como `@EmitsEvent`, la configuración de prueba estándar de NestJS no es suficiente. La lógica de emisión de eventos y propagación de metadatos depende de que varios servicios de `SagaEventModule` estén disponibles en el contenedor de inyección de dependencias.

Para simplificar este proceso, el módulo proporciona `SagaEventTestingModule`, un módulo de prueba dedicado que viene preconfigurado con todos los proveedores y simulacros necesarios para servicios con efectos secundarios (como acceso a bases de datos o al sistema de archivos).

### Cómo Usarlo

Para probar un servicio, importa `SagaEventTestingModule` en tu archivo de prueba e inclúyelo en el array `imports` de tu `TestingModule`. Solo necesitas proporcionar el servicio que estás probando.

A continuación se muestra un ejemplo de cómo probar `UserService`:

```typescript
// src/sample/simple/user/user.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { SagaEventTestingModule } from '#/src/saga-event-module/testing/saga-event-testing.module';
import { CreateUserDto } from './user.dto';
import { vi } from 'vitest';

describe('UserService', () => {
  let service: UserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      // Importa el módulo de prueba
      imports: [SagaEventTestingModule],
      // Proporciona el servicio que quieres probar
      providers: [UserService],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createUser', () => {
    it('debería crear un usuario exitosamente y emitir un evento de éxito', async () => {
      // Simula cualquier dependencia externa si es necesario
      vi.spyOn(Math, 'random').mockReturnValue(0.6); // Asegura que no falle

      const createUserDto: CreateUserDto = {
        name: 'Test User',
        email: 'test@example.com',
      };

      // El decorador @EmitsEvent se encargará de la emisión del evento automáticamente
      const result = await service.createUser(createUserDto);

      expect(result).toEqual({ id: '12345', ...createUserDto });
      // Puedes añadir más aserciones aquí para verificar si se emitieron eventos,
      // por ejemplo, espiando en EventEmitter2.
    });

    it('debería manejar un error y emitir un evento de fallo', async () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.4); // Asegura que falle

      const createUserDto: CreateUserDto = {
        name: 'Test User',
        email: 'test@example.com',
      };

      // El decorador capturará el error y emitirá el evento de fallo
      const result = await service.createUser(createUserDto);

      expect(result).toBeUndefined();
    });
  });
});
```

Esta configuración asegura que cuando se llama a `userService.createUser`, el decorador `@EmitsEvent` tiene acceso a todos los servicios que necesita para funcionar correctamente dentro de un entorno de prueba.

## Licencia

Este proyecto está licenciado bajo la Licencia MIT.
