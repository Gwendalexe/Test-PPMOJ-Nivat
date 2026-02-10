export interface EnigmeSemaine {
  id: number;
  figure_path: string;
  nb_val_to_find: number;
  problem_statement?: string;
  problem_question?: string;
  variables: string[];
  values_list: number[][];
  solution: number[];
  date: string;
  displayed: boolean;
  reward_mojette?: number;
  reward_token_coin?: number;
}
