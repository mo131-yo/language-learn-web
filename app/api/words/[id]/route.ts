import { NextResponse } from "next/server";
import { queryOne } from "@/lib/db";
import { getSessionUser } from "@/lib/auth-helpers";
import { masterySchema, updateWordSchema } from "@/lib/validators";
import type { Word } from "@/lib/types";

type WordOwnerRow = {
  author_id: string | null;
};

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const body = await request.json();
  const { id } = await context.params;

  if ("mastery" in body) {
    const parsed = masterySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Mastery must be between 0 and 5." }, { status: 400 });
    }

    const sessionUser = await getSessionUser();

    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const word = await queryOne<Word>(
      `with existing_word as (
         select * from words where id = $2
       ),
       upserted_mastery as (
         insert into user_word_mastery (user_id, word_id, mastery, updated_at)
         select $3, id, $1, now()
         from existing_word
         on conflict (user_id, word_id)
         do update set mastery = excluded.mastery, updated_at = now()
         returning word_id, mastery
       )
       select
         existing_word.*,
         upserted_mastery.mastery::int as mastery,
         c.name as category_name,
         c.color as category_color
       from existing_word
       join upserted_mastery on upserted_mastery.word_id = existing_word.id
       left join categories c on c.id = existing_word.category_id`,
      [parsed.data.mastery, id, sessionUser.userId]
    );

    if (!word) {
      return NextResponse.json({ error: "Word not found." }, { status: 404 });
    }

    return NextResponse.json(word);
  }

  const parsed = updateWordSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Word data is invalid." }, { status: 400 });
  }

  const sessionUser = await getSessionUser();

  if (!sessionUser) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const owner = await queryOne<WordOwnerRow>(
    "select author_id from words where id = $1",
    [id]
  );

  if (!owner) {
    return NextResponse.json({ error: "Word not found." }, { status: 404 });
  }

  if (!owner.author_id || owner.author_id !== sessionUser.userId) {
    return NextResponse.json({ error: "Only the author can edit this word." }, { status: 403 });
  }

  const word = await queryOne<Word>(
    `with updated as (
       update words
       set term = $1, meaning = $2, example = $3, category_id = $4
       where id = $5
       returning *
     )
     select updated.*, c.name as category_name, c.color as category_color
     from updated
     left join categories c on c.id = updated.category_id`,
    [
      parsed.data.term,
      parsed.data.meaning,
      parsed.data.example,
      parsed.data.categoryId ?? null,
      id,
    ]
  );

  return NextResponse.json(word);
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const sessionUser = await getSessionUser();

  if (!sessionUser) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { id } = await context.params;
  const owner = await queryOne<WordOwnerRow>(
    "select author_id from words where id = $1",
    [id]
  );

  if (!owner) {
    return NextResponse.json({ error: "Word not found." }, { status: 404 });
  }

  if (!owner.author_id || owner.author_id !== sessionUser.userId) {
    return NextResponse.json({ error: "Only the author can delete this word." }, { status: 403 });
  }

  const deleted = await queryOne<{ id: string }>(
    "delete from words where id = $1 returning id",
    [id]
  );

  return NextResponse.json({ deleted: Boolean(deleted), id });
}
