import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth-helpers";
import { queryOne } from "@/lib/db";
import { quizAttemptSchema } from "@/lib/validators";

export async function POST(request: Request) {
  const sessionUser = await getSessionUser();

  if (!sessionUser) {
    return NextResponse.json({ error: "Нэвтрэх шаардлагатай." }, { status: 401 });
  }

  const parsed = quizAttemptSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ error: "Шалгалтын мэдээлэл буруу байна." }, { status: 400 });
  }

  const attempt = await queryOne(
    `insert into quiz_attempts (user_id, category_id, score, correct_count, total_count)
     values ($1, $2, $3, $4, $5)
     returning *`,
    [
      sessionUser.userId,
      parsed.data.categoryId ?? null,
      parsed.data.score,
      parsed.data.correctCount,
      parsed.data.totalCount,
    ]
  );

  return NextResponse.json(attempt);
}
