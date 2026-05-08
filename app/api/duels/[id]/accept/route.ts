import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth-helpers";
import { query } from "@/lib/db";
import { getDuel, getUserXp } from "@/lib/duels";

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  const sessionUser = await getSessionUser();

  if (!sessionUser) {
    return NextResponse.json({ error: "Нэвтрэх шаардлагатай." }, { status: 401 });
  }

  const { id } = await context.params;
  const duel = await getDuel(id);

  if (!duel) {
    return NextResponse.json({ error: "1v1 сорилт олдсонгүй." }, { status: 404 });
  }

  if (duel.opponent_id !== sessionUser.userId) {
    return NextResponse.json({ error: "Зөвхөн урьсан хэрэглэгч зөвшөөрнө." }, { status: 403 });
  }

  if (duel.status !== "pending") {
    return NextResponse.json({ error: "Энэ сорилт аль хэдийн эхэлсэн байна." }, { status: 400 });
  }

  const myXp = await getUserXp(sessionUser.userId);

  if (myXp < duel.stake_xp) {
    return NextResponse.json({ error: "Бооцоо тавих XP хүрэлцэхгүй байна." }, { status: 400 });
  }

  await query(
    `update duel_challenges
     set status = 'active', updated_at = now()
     where id = $1`,
    [duel.id]
  );

  return NextResponse.json(await getDuel(duel.id));
}
