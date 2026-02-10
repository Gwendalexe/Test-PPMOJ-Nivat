import { FixedLengthTuple } from './Generics';

export interface Nivat<W extends number = number, H extends number = number> {
  id: string;
  level: number;
  date: Date;
  width: W;
  height: H;
  solved: boolean;
  grid: FixedLengthTuple<FixedLengthTuple<NivatGridValue, W>, H>;
}

export type NivatGridValue = -1 | 0 | 1;
export enum MoveDirection {
  Up = 'up',
  Down = 'down',
  Left = 'left',
  Right = 'right',
}
