import { Injectable } from '@nestjs/common';
import {
  CustomGraph,
  NodeShape,
  NodeType,
} from './interfaces/graph.interfaces';

@Injectable()
export class MermaidParserService {
  private graph: CustomGraph;
  private nodeRegistry = new Map<string, string>();
  private classDefs = new Map<string, string>();
  private nodeIdCounter = 0;

  constructor() {
    this.clear();
  }

  public clear(): void {
    this.graph = { nodes: [], edges: [] };
    this.nodeRegistry.clear();
    this.classDefs.clear();
    this.nodeIdCounter = 0;
  }

  public addClassDef(name: string, style: string): void {
    this.classDefs.set(name, style);
  }

  private getNodeId(name: string): string {
    if (!this.nodeRegistry.has(name)) {
      const cleanName = name.replace(/[^\w.-]/gi, '_');
      const id = `N${this.nodeIdCounter++}_${cleanName}`;
      this.nodeRegistry.set(name, id);
    }
    return this.nodeRegistry.get(name)!;
  }

  public addNode(
    name: string,
    type: NodeType,
    shape: NodeShape = 'rect',
    link?: string,
    tooltip?: string,
  ): void {
    const id = this.getNodeId(name);
    if (!this.graph.nodes.some((n) => n.id === id)) {
      this.graph.nodes.push({ id, label: name, type, shape, link, tooltip });
    }
  }

  public addEdge(
    fromName: string,
    toName: string,
    label: string,
    style: 'solid' | 'dotted',
  ): void {
    const fromId = this.getNodeId(fromName);
    const toId = this.getNodeId(toName);
    this.graph.edges.push({ from: fromId, to: toId, label, style });
  }

  public build(): string {
    let mermaidCode = 'graph TD;\n\n';

    // Add default styles that can be overridden
    this.addClassDef(
      'emitterStyle',
      'fill:#d4edda,stroke:#c3e6cb,color:#155724',
    );
    this.addClassDef(
      'handlerStyle',
      'fill:#d1ecf1,stroke:#bee5eb,color:#0c5460',
    );
    this.addClassDef(
      'listenerStyle',
      'fill:#fff3cd,stroke:#ffeeba,color:#856404',
    );
    this.addClassDef('gateStyle', 'fill:#e2e3e5,stroke:#d6d8db,color:#383d41');

    for (const [name, style] of this.classDefs.entries()) {
      mermaidCode += `    classDef ${name} ${style}\n`;
    }
    mermaidCode += '\n';

    mermaidCode += `    subgraph "Flujo de Eventos"\n`;
    for (const node of this.graph.nodes) {
      switch (node.shape) {
        case 'stadium':
          mermaidCode += `        ${node.id}(["${node.label}"])\n`;
          break;
        case 'rhombus':
          mermaidCode += `        ${node.id}{"${node.label}"}\n`;
          break;
        default:
          mermaidCode += `        ${node.id}["${node.label}"]\n`;
      }
    }
    mermaidCode += '\n';

    for (const edge of this.graph.edges) {
      const link =
        edge.style === 'solid'
          ? `-- ${edge.label} -->`
          : `-. ${edge.label} .->`;
      mermaidCode += `        ${edge.from} ${link} ${edge.to}\n`;
    }
    mermaidCode += `    end\n\n`;

    const legendEmitterId = this.getNodeId(
      'Emisor (Inicia un proceso de negocio o "Saga")',
    );
    const legendHandlerId = this.getNodeId(
      'Manejador (Recibe un evento y emite otros para continuar el flujo)',
    );
    const legendListenerId = this.getNodeId(
      'Receptor (Recibe un evento y finaliza una rama del flujo, ej: notificar)',
    );
    const legendEventId = this.getNodeId(
      'Evento (Mensaje que representa un hecho ocurrido en el sistema)',
    );
    const legendGateId = this.getNodeId(
      'Compuerta Lógica (Espera varios eventos antes de continuar)',
    );
    const legendAId = this.getNodeId('A');
    const legendBId = this.getNodeId('B');
    const legendCId = this.getNodeId('C');
    const legendDId = this.getNodeId('D');

    mermaidCode += `    subgraph Leyenda\n`;
    mermaidCode += `        direction LR\n`;
    mermaidCode += `        ${legendEmitterId}["Emisor (Inicia un proceso de negocio o 'Saga')"]\n`;
    mermaidCode += `        ${legendHandlerId}["Manejador (Recibe un evento y emite otros para continuar el flujo)"]\n`;
    mermaidCode += `        ${legendListenerId}["Receptor (Recibe un evento y finaliza una rama del flujo, ej: notificar)"]\n`;
    mermaidCode += `        ${legendEventId}(("Evento (Mensaje que representa un hecho ocurrido en el sistema)"))\n`;
    mermaidCode += `        ${legendGateId}["Compuerta Lógica (Espera varios eventos antes de continuar)"]\n`;
    mermaidCode += `        subgraph "Relaciones"\n`;
    mermaidCode += `            direction LR\n`;
    mermaidCode += `            ${legendAId}( ) -- Emite --> ${legendBId}( )\n`;
    mermaidCode += `            ${legendCId}( ) -. Dispara .-> ${legendDId}( )\n`;
    mermaidCode += `        end\n`;
    mermaidCode += `    end\n\n`;

    const styles = new Map<NodeType, string[]>();
    for (const node of this.graph.nodes) {
      if (!styles.has(node.type)) {
        styles.set(node.type, []);
      }
      styles.get(node.type)!.push(node.id);
    }

    for (const [type, nodeIds] of styles.entries()) {
      if (nodeIds.length > 0) {
        mermaidCode += `    class ${nodeIds.join(',')} ${type}Style\n`;
      }
    }

    mermaidCode += `    class ${legendEmitterId} emitterStyle\n`;
    mermaidCode += `    class ${legendHandlerId} handlerStyle\n`;
    mermaidCode += `    class ${legendListenerId} listenerStyle\n`;
    mermaidCode += `    class ${legendGateId} gateStyle\n`;

    return mermaidCode;
  }
}
