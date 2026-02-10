// see https://stackoverflow.com/a/52490977 for info on the following Types
export type FixedLengthTuple<T, N extends number> = N extends N
  ? number extends N
    ? T[]
    : _TupleOf<T, N, []>
  : never;

type _TupleOf<T, N extends number, R extends unknown[]> = R['length'] extends N
  ? R
  : _TupleOf<T, N, [T, ...R]>;

export type Nullable<T> = T | null;

export const Colors = {
  Yellow: '#FFD166',
  Red: '#FF6542',
  Green: '#81E979',
  White: '#F4FAFF',
  Blue: '#4392F1',
  Pink: '#FF99B8',
  Purple: '#864EB8',
};
