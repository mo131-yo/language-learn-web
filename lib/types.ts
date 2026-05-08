export type Category = {
  id: string;
  name: string;
  color: string;
  created_at: string;
};

export type Word = {
  id: string;
  term: string;
  meaning: string;
  example: string;
  category_id: string | null;
  category_name: string | null;
  category_color: string | null;
  author_name: string;
  author_id?: string | null;
  mastery: number;
  created_at: string;
};

export type Challenge = {
  id: string;
  title: string;
  category_id: string | null;
  category_name: string | null;
  host_name: string;
  host_id?: string | null;
  invite_code: string;
  remind_message: string;
  duration_days: number;
  expires_at: string | null;
  members: string[];
  created_at: string;
};

export type DuelWord = {
  id: string;
  term: string;
  meaning: string;
};

export type DuelAnswer = {
  wordId: string;
  answer: string;
  timeMs: number;
};

export type DuelChallenge = {
  id: string;
  challenger_id: string;
  challenger_name: string;
  challenger_avatar: string | null;
  opponent_id: string;
  opponent_name: string;
  opponent_avatar: string | null;
  category_id: string | null;
  category_name: string | null;
  stake_xp: number;
  time_limit_seconds: number;
  words: DuelWord[];
  challenger_answers: DuelAnswer[] | null;
  opponent_answers: DuelAnswer[] | null;
  challenger_score: number | null;
  opponent_score: number | null;
  winner_id: string | null;
  status: "pending" | "active" | "completed" | "cancelled";
  settled_at: string | null;
  created_at: string;
  updated_at: string;
};

export type LeaderboardUser = {
  id: string;
  name: string;
  email: string | null;
  avatar: string | null;
  bio: string;
  xp: number;
  words_count: number;
  mastered_words: number;
  quiz_attempts: number;
  quiz_average: number;
  last_active_at?: number | null;
};

export type Profile = {
  id: string;
  display_name: string;
  daily_goal: number;
  favorite_category_id: string | null;
  notifications_enabled: boolean;
  created_at: string;
  updated_at: string;
};

export type HomeData = {
  categories: Category[];
  words: Word[];
  challenges: Challenge[];
  duels: DuelChallenge[];
  leaderboard: LeaderboardUser[];
};
