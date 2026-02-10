export interface Enigme {
  id: number;
  type: number;
  niveau: number;
  recompense: number;
  statement: string;
  nb_question: number;
  figure_path: string;
  question: Array<string>; // Remarquez que j'ai changé le type en tableau de chaînes de caractères
  variables: Array<string>;
  values_list: Array<Array<number>>; // Vous pouvez laisser le type générique any si le contenu est dynamique
  help_1: string;
  help_2: string;
  help_3: string;
  help_cost: Array<number>;
  reward: number;
  nb_help: number;
}
