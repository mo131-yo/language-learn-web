import { query } from "@/lib/db";
import type { Category, Challenge, Word } from "@/lib/types";

export async function getHomeData() {
  const [categories, words, challenges] = await Promise.all([
    query<Category>("select * from categories order by name asc"),
    query<Word>(
      `select w.*, c.name as category_name, c.color as category_color
       from words w
       left join categories c on c.id = w.category_id
       order by w.created_at desc`
    ),
    query<Challenge>(
      `select ch.*, c.name as category_name, array_remove(array_agg(cm.display_name order by cm.joined_at), null) as members
       from challenges ch
       left join categories c on c.id = ch.category_id
       left join challenge_members cm on cm.challenge_id = ch.id
       group by ch.id, c.name
       order by ch.created_at desc`
    )
  ]);

  return { categories, words, challenges };
}
