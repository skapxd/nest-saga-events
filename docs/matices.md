Matices a Discutir:

1.  Rol del Decorador (`@EmitsEvent` vs. `@AuditMethod`):
    Q: Nuestro @AuditMethod actual es "mágico": oculta la lógica de try/catch y la emisión de eventos. El desarrollador solo añade el decorador y se olvida.
    A: La idea es que el EmitsEvent tambien sea magico, es decir, que el desarrollador coloque el decorador @EmitsEvent y sea el decorador quien decida si lanzar un evento exitoso o un evento fallido segun el estatus de la solicitud, es decir, si la solicitud lanza una excepcion entonces el decorador debe lanzar un evento con la notacion de que algo fallo, y ese evento debe estar documentado en el propio decorador, es decir, en el onSuccess y onFailure

    Q: El @EmitsEvent del documento es declarativo: solo sirve como metadatos para la generación de tipos y la documentación. El desarrollador todavía tiene que escribir el try/catch y llamar a
      this.eventEmitter.emit(...) explícitamente dentro del método.
    A: Correcto, la idea es que el desarrollador no tenga que lanzar manualmente el evento y estar pendiente de la logica de this.eventEmitter.emit(...)

    Q: ¿Qué enfoque prefieres? ¿Mantenemos la "magia" de nuestro decorador (lo que reduce el código repetitivo en los servicios) o nos alineamos con el documento, haciendo la emisión de eventos
      explícita (lo que puede ser más claro para quien lee el código)?
    A: Mantengamos la magia, que para eso estamos creando un modulo reutilizable

2.  Alcance: ¿Módulo Interno o Paquete Externo?
    Q: El documento habla de crear un paquete reutilizable (saga-event-module).
    A: Por ahora creemos un modulo que tenga todo lo necesario para funcionar cuando decidamos copiar y pegar la carpeta en otro proyecto, es decir, que lo unico que necesite sea descargar las dependencias que necesita 

    Q: Para este ejercicio, ¿construimos toda esta lógica dentro de nuestro proyecto actual (en el directorio src/audit o uno nuevo como src/saga-event) o simulamos la creación de un módulo
      externo desde el principio? Mi recomendación sería construirlo internamente primero como prueba de concepto.
    A: Correcto, primero creemos la prueba de concepto antes de convertirlo en un paquete distribuible mediante npm o yarn 

3.  Trazabilidad y Metadatos (`correlationId`, `actor`):
    - Este es el corazón de la saga coreografiada. Requiere un EventMetadataHelper y que los métodos de servicio acepten un actor o un causationEvent para propagar el contexto.
    Q: ¿Asumimos que este es un requisito fundamental desde el inicio? Implementarlo significa que cambiaremos las firmas de nuestros métodos en AppService para pasar estos metadatos.
    A: Sí, asumimos que la trazabilidad y los metadatos son un requisito fundamental e innegociable desde el inicio. Sin embargo, la afirmación de que "implementarlo significa que cambiaremos las firmas de
        nuestros métodos" es una verdad a medias que podemos y debemos superar.

        Nuestra estrategia no será forzar a los desarrolladores a modificar manualmente las firmas de sus métodos de negocio con parámetros de trazabilidad. Hacerlo es frágil, propenso a errores y contamina la
        lógica de negocio.

        En su lugar, adoptaremos una solución de infraestructura a nivel de framework que se encargará de la propagación del contexto de forma automática y declarativa. Esta solución se basa en tres pilares:

        1. Contexto de Ejecución Implícito (`AsyncLocalStorage`): Para el inicio de cualquier saga (ya sea una petición HTTP, un CRON job o un worker), utilizaremos AsyncLocalStorage para establecer un contexto de
            ejecución implícito. Esto nos permite capturar el correlationId y el actor inicial sin alterar la firma del primer método en la cadena.

        2. Transferencia de Contexto Explícita en Eventos: El contexto implícito es efímero. Para propagarlo entre los pasos asíncronos de una saga, lo extraeremos y lo incrustaremos de forma explícita en el
            payload de cada evento emitido. El evento se convierte en el vehículo que transporta la trazabilidad a través de los límites de los procesos.

        3. Inyección de Contexto Declarativa con Decoradores: Para que los desarrolladores puedan acceder a este contexto en los pasos subsiguientes de la saga, no les obligaremos a hacer "prop drilling" manual. En
            su lugar, les proporcionaremos un conjunto de decoradores de parámetros personalizados, inspirados en NestJS:
            * @CausationEvent(): Para declarar cuál es el evento entrante que contiene la metadata a propagar.
            * @EventMetadata(): Para inyectar directamente el objeto de metadata (ya sea el propagado o uno nuevo) en una variable del método, listo para ser usado.

        En conclusión: Sí, la trazabilidad es clave, pero la implementaremos de una manera que no impacte negotivamente la firma de los métodos de negocio. La complejidad de la propagación de metadatos será
        absorbida por nuestra capa de abstracción (decoradores y helpers), permitiendo que el código de la aplicación se mantenga limpio, legible y enfocado en su lógica principal. Cambiamos la firma, sí, pero lo
        hacemos de forma declarativa y opcional a través de decoradores, no como un requisito imperativo en cada método.

4.  Persistencia de Eventos (`EventLogService`):
    - El documento propone persistir todos los eventos. Esto normalmente requeriría una base de datos.
    Q: Para nuestra práctica, ¿es suficiente con que el EventLogService simplemente los imprima en la consola (similar a nuestro AuditService actual) o quieres que simulemos una persistencia real
      (por ejemplo, guardando en un array en memoria o en un archivo JSON)?
    A: Necesitamos simular que los datos se estan guardando en una base de datos, pero para este proyecto que es una prueba piloto sobre est forma de implementarlo, usaremos una base de datos json por motivos de simplicidad

5.  Generación de Tipos:
    - La idea de un generador de tipos que escanee los decoradores @EmitsEvent es muy potente, pero técnicamente avanzada (requiere manipular el AST de TypeScript).
    Q: ¿Dejamos la implementación del generador de tipos como un objetivo final o lo consideramos fuera del alcance de esta sesión de práctica, enfocándonos primero en el flujo de ejecución de la
      saga?
    A: La respuesta es que no se necesita la monipulacion del AST de typescript ya que aprovecharemos la creacion de decoradores, inicialmente lo que se me ocurre es tener un decorador que intercepta el servicio y emite los eventos, de esta forma, los datos que tengamos en ese decorador seran nuestra fuente de la verdad de los posibles eventos emitidos, y para extraer la informacion de esos decoradores no es necesario manipular el AST, lo que se requiere para lograrlo es hacer el descubrimiento de los decoradores y extraer esa informacion para luego generar los tipos que seran usados para documentar la relacion entre los diferentes eventos 

