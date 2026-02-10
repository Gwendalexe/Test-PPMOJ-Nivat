export interface Mojette {
  id: number;
  level: number;
  date: Date;
  width: number;
  height: number;
  solved: boolean;
  shape_name: MojetteShapeTypes;
  array_box: Array<number>;
  nb_bin_right: number;
  nb_bin_left: number;
  nb_bin_down: number;
  bin_values: Array<number>;
  reward: number;
  help_1_percent_cost: number;
}

export enum MojetteShapeTypes {
  diamond = 'diamond',
  circle = 'circle',
  triangle = 'triangle',
}
