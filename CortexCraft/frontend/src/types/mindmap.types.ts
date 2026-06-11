export type MindMapNode = {
  id: string;
  label: string;
  x: number;
  y: number;
  children?: MindMapNode[];
};
