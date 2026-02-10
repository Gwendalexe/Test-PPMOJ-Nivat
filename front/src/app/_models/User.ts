export interface User {
  id?: number;
  username?: string;
  email?: string;
  password: string;
  points?: number;
  token_coin?: string;
  mojettes?: number;
  role?: string;
  confirmed?: boolean;
  tutorial_mojette_done?: boolean;
  created_at?: string;
}
