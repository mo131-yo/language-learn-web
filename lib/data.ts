import { query } from "@/lib/db";
import { getSessionUser } from "@/lib/auth-helpers";
import type {
  Category,
  Challenge,
  LeaderboardUser,
  Word,
} from "@/lib/types";

export async function getHomeData() {
  const sessionUser = await getSessionUser();

  const [categories, words, challenges, leaderboard] = await Promise.all([
    query<Category>("select * from categories order by name asc"),
    query<Word>(
      `select
         w.*,
         coalesce(uwm.mastery, 0)::int as mastery,
         c.name as category_name,
         c.color as category_color
       from words w
       left join categories c on c.id = w.category_id
       left join user_word_mastery uwm on uwm.word_id = w.id and uwm.user_id = $1
       order by w.created_at desc`,
      [sessionUser?.userId ?? null]
    ),
    query<Challenge>(
      `select ch.*, c.name as category_name, array_remove(array_agg(cm.display_name order by cm.joined_at), null) as members
       from challenges ch
       left join categories c on c.id = ch.category_id
       left join challenge_members cm on cm.challenge_id = ch.id
       group by ch.id, c.name
       order by ch.created_at desc`
    ),
    query<LeaderboardUser>(
      `select
         u.id,
         u.name,
         u.email,
         u.avatar,
         u.bio,
         coalesce(sum(uwm.mastery * 20), 0)::int as xp,
         coalesce(count(uwm.word_id) filter (where uwm.mastery > 0), 0)::int as words_count,
         coalesce(sum(case when uwm.mastery >= 4 then 1 else 0 end), 0)::int as mastered_words
       from users u
       left join user_word_mastery uwm on uwm.user_id = u.id
       group by u.id, u.name, u.email, u.avatar, u.bio
       order by xp desc, mastered_words desc, words_count desc, u.created_at asc`
    ),
  ]);

  return { categories, words, challenges, leaderboard };
}
