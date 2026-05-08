import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth-helpers";
import { query } from "@/lib/db";
import { getDuel, scoreDuelAnswers, settleDuelIfReady } from "@/lib/duels";
import { duelSubmitSchema } from "@/lib/validators";
import type { DuelWord } from "@/lib/types";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const sessionUser = await getSessionUser();

  if (!sessionUser) {
    return NextResponse.json({ error: "Нэвтрэх шаардлагатай." }, { status: 401 });
  }

  const { id } = await context.params;
  const duel = await getDuel(id);

  if (!duel) {
    return NextResponse.json({ error: "1v1 сорилт олдсонгүй." }, { status: 404 });
  }

  const isChallenger = duel.challenger_id === sessionUser.userId;
  const isOpponent = duel.opponent_id === sessionUser.userId;

  if (!isChallenger && !isOpponent) {
    return NextResponse.json({ error: "Энэ сорилтод оролцогч биш байна." }, { status: 403 });
  }

  if (duel.status !== "active") {
    return NextResponse.json({ error: "Энэ сорилт эхлээгүй эсвэл дууссан байна." }, { status: 400 });
  }

  if (isChallenger && duel.challenger_answers) {
    return NextResponse.json({ error: "Та энэ 1v1-д аль хэдийн хариулсан байна." }, { status: 400 });
  }

  if (isOpponent && duel.opponent_answers) {
    return NextResponse.json({ error: "Та энэ 1v1-д аль хэдийн хариулсан байна." }, { status: 400 });
  }

  const parsed = duelSubmitSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ error: "Хариултын мэдээлэл буруу байна." }, { status: 400 });
  }

  const words = duel.words as DuelWord[];
  const score = scoreDuelAnswers(words, parsed.data.answers, duel.time_limit_seconds);

  if (isChallenger) {
    await query(
      `update duel_challenges
       set challenger_answers = $2::jsonb,
           challenger_score = $3,
           updated_at = now()
       where id = $1`,
      [duel.id, JSON.stringify(parsed.data.answers), score]
    );
  } else {
    await query(
      `update duel_challenges
       set opponent_answers = $2::jsonb,
           opponent_score = $3,
           updated_at = now()
       where id = $1`,
      [duel.id, JSON.stringify(parsed.data.answers), score]
    );
  }

  const settled = await settleDuelIfReady(duel.id);
  return NextResponse.json(settled);
}
