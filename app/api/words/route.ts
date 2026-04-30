import { NextResponse } from "next/server";
import { queryOne } from "@/lib/db";
import { wordSchema } from "@/lib/validators";
import { getSessionUser, verifyToken } from "@/lib/auth-helpers";
import { broadcast } from "@/lib/sse-store";
import type { Word } from "@/lib/types";

type UserNameRow = {
  name: string;
};

export async function POST(request: Request) {
  const parsed = wordSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Word data is invalid." }, { status: 400 });
  }

  let authorName = parsed.data.authorName || "Anonymous";
  let userId: string | null = null;

  const sessionUser = await getSessionUser();
  if (sessionUser) {
    authorName = sessionUser.name;
    userId = sessionUser.userId;
  }

  const authHeader = request.headers.get("authorization");
  if (!userId && authHeader?.startsWith("Bearer ")) {
    try {
      const token = authHeader.slice(7);
      const decoded = verifyToken(token);
      const user = await queryOne<UserNameRow>(
        "SELECT name FROM users WHERE id = $1",
        [decoded.userId],
      );
      if (user) {
        authorName = user.name;
        userId = decoded.userId;
      }
    } catch {
      /* invalid token, ignore */
    }
  }

  const word = await queryOne<Word>(
    `with inserted as (
       insert into words (term, meaning, example, category_id, author_name, author_id)
       values ($1, $2, $3, $4, $5, $6)
       returning *
     )
     select inserted.*, c.name as category_name, c.color as category_color
     from inserted
     left join categories c on c.id = inserted.category_id`,
    [
      parsed.data.term,
      parsed.data.meaning,
      parsed.data.example,
      parsed.data.categoryId ?? null,
      authorName,
      userId,
    ]
  );

  if (word) {
    broadcast("word-added", word);
  }

  return NextResponse.json(word);
}
