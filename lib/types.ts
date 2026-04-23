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
  invite_code: string;
  remind_message: string;
  members: string[];
  created_at: string;
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
};
