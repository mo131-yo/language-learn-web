import { NextResponse } from "next/server";
import { queryOne } from "@/lib/db";
import { wordSchema } from "@/lib/validators";

export async function POST(request: Request) {
  const parsed = wordSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ error: "Word data is invalid." }, { status: 400 });
  }

  const word = await queryOne(
    `insert into words (term, meaning, example, category_id, author_name)
     values ($1, $2, $3, $4, $5)
     returning *`,
    [
      parsed.data.term,
      parsed.data.meaning,
      parsed.data.example,
      parsed.data.categoryId ?? null,
      parsed.data.authorName
    ]
  );

  return NextResponse.json(word);
}
