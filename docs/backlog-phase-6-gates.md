# Blueprint de Implementación: `@OnEventDoc` para Múltiples Eventos

**Versión 6 (Enfoque Final)**
**Estado:** 📝 Plan Aprobado

**Objetivo:** Evolucionar el decorador `@OnEventDoc` para que acepte un array de eventos, actuando como una compuerta lógica "OR" tanto a nivel funcional como de documentación.

---

## Roadmap de Implementación

### Épica 1: Actualización del Decorador y Documentación
**Objetivo:** Modificar la firma del decorador y adaptar el servicio de documentación para que entienda la nueva sintaxis de array.

- `[x] Tarea 1: Modificar la firma de `@OnEventDoc` y su `Metadata` para aceptar `AppEventName | AppEventName[]`.`
- `[x] Tarea 2: Actualizar `EventDocumentationService` para que genere el grafo correctamente a partir del array de eventos.`
- `[x] **VERIFICACIÓN ÉPICA 1:** Ejecutar `yarn build`.`
- `[x] **COMMIT ÉPICA 1:** feat(saga-event): allow @OnEventDoc to handle multiple events`

### Épica 2: Validación y Ejemplo
**Objetivo:** Demostrar que la nueva funcionalidad se comporta como se espera y está bien documentada para los desarrolladores.

- `[x] Tarea 3: Actualizar un servicio de ejemplo para usar `@OnEventDoc` con un array.`
- `[x] Tarea 4: Verificar que el diagrama Mermaid generado es correcto.`
- `[x] **VERIFICACIÓN ÉPICA 2:** Ejecutar `yarn build`.`
- `[ ] **COMMIT ÉPICA 2:** docs(saga-event): update example to use @OnEventDoc with multiple events`

---
