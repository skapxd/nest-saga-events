export type NodeType = 'emitter' | 'handler' | 'listener' | 'event' | 'gate';
export type NodeShape = 'rect' | 'stadium' | 'rhombus';
export type EdgeStyle = 'solid' | 'dotted';

export interface GraphNode {
  id: string;
  label: string;
  type: NodeType;
  shape: NodeShape;
  link?: string;
  tooltip?: string;
}

export interface GraphEdge {
  from: string;
  to: string;
  label?: string;
  style: EdgeStyle;
}

export interface CustomGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}
