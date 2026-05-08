import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth-helpers";
import { query, queryOne } from "@/lib/db";
import { getDuel, getUserXp } from "@/lib/duels";
import { duelCreateSchema } from "@/lib/validators";
import type { DuelWord } from "@/lib/types";

export async function GET() {
  const sessionUser = await getSessionUser();

  if (!sessionUser) {
    return NextResponse.json({ error: "Нэвтрэх шаардлагатай." }, { status: 401 });
  }

  const duels = await query(
    `select
       d.*,
       challenger.name as challenger_name,
       challenger.avatar as challenger_avatar,
       opponent.name as opponent_name,
       opponent.avatar as opponent_avatar,
       c.name as category_name
     from duel_challenges d
     join users challenger on challenger.id = d.challenger_id
     join users opponent on opponent.id = d.opponent_id
     left join categories c on c.id = d.category_id
     where d.challenger_id = $1 or d.opponent_id = $1
     order by d.created_at desc
     limit 20`,
    [sessionUser.userId]
  );

  return NextResponse.json(duels);
}

export async function POST(request: Request) {
  const sessionUser = await getSessionUser();

  if (!sessionUser) {
    return NextResponse.json({ error: "Нэвтрэх шаардлагатай." }, { status: 401 });
  }

  const parsed = duelCreateSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ error: "1v1 сорилтын мэдээлэл буруу байна." }, { status: 400 });
  }

  const { opponentId, categoryId, stakeXp, timeLimitSeconds } = parsed.data;

  if (opponentId === sessionUser.userId) {
    return NextResponse.json({ error: "Өөр хэрэглэгч сонгоно уу." }, { status: 400 });
  }

  const [opponent, myXp] = await Promise.all([
    queryOne<{ id: string }>("select id from users where id = $1", [opponentId]),
    getUserXp(sessionUser.userId),
  ]);

  if (!opponent) {
    return NextResponse.json({ error: "Хэрэглэгч олдсонгүй." }, { status: 404 });
  }

  if (myXp < stakeXp) {
    return NextResponse.json({ error: "Бооцоо тавих XP хүрэлцэхгүй байна." }, { status: 400 });
  }

  const wordRows = await query<DuelWord>(
    `select id, term, meaning
     from words
     where ($1::uuid is null or category_id = $1::uuid)
     order by random()
     limit 5`,
    [categoryId ?? null]
  );

  if (wordRows.length < 3) {
    return NextResponse.json({ error: "Энэ төрөлд 1v1 хийхэд хангалттай үг алга." }, { status: 400 });
  }

  const created = await queryOne<{ id: string }>(
    `insert into duel_challenges (
       challenger_id,
       opponent_id,
       category_id,
       stake_xp,
       time_limit_seconds,
       words
     )
     values ($1, $2, $3, $4, $5, $6::jsonb)
     returning id`,
    [
      sessionUser.userId,
      opponentId,
      categoryId ?? null,
      stakeXp,
      timeLimitSeconds,
      JSON.stringify(wordRows),
    ]
  );

  const duel = created ? await getDuel(created.id) : null;
  return NextResponse.json(duel);
}
