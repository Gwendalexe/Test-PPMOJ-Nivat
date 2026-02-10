export interface CarreProblem {
  id: number;
  level: number;
  width: number;
  height: number;
  carre_list: Array<number>;
}

export interface SolutionTile {
  gridX: number;
  gridY: number;
  size: number;
}

export interface Tile extends SolutionTile {
  id: number;
  width: number;
  x: number;
  y: number;
  'z-index': number;
  color: {
    background: string;
    color: string;
  };
}
