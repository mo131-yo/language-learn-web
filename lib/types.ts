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

export type LeaderboardUser = {
  id: string;
  name: string;
  email: string | null;
  avatar: string | null;
  bio: string;
  xp: number;
  words_count: number;
  mastered_words: number;
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
  leaderboard: LeaderboardUser[];
};
