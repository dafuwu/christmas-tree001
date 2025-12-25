
export enum AppMode {
  TREE = 'TREE',
  SCATTER = 'SCATTER',
  ZOOM = 'ZOOM'
}

export interface HandLandmark {
  x: number;
  y: number;
  z: number;
}

export interface GestureState {
  isFist: boolean;
  isOpenPalm: boolean;
  isPinching: boolean;
  handPosition: { x: number; y: number };
}

export interface PhotoData {
  id: string;
  url: string;
}

export interface OrnamentData {
  id: number;
  type: 'sphere' | 'box' | 'torus'; // Added Torus for Wreaths/Rings
  color: string;
  positionTree: [number, number, number];
  positionScatter: [number, number, number];
  scale: number;
}
