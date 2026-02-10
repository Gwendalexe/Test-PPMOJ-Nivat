export interface LeaderboardEntry {
  user_id: number;
  username: string;
  completion_time: number;
  helps_used: number;
  position: number;
  score: number;
}

export interface Leaderboard {
  top: LeaderboardEntry[];
  user: LeaderboardEntry;
  above_user: LeaderboardEntry[];
  below_user: LeaderboardEntry[];
}
