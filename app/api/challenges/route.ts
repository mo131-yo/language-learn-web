import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { queryOne } from "@/lib/db";
import { getSessionUser } from "@/lib/auth-helpers";
import { challengeSchema } from "@/lib/validators";

export async function POST(request: Request) {
  const parsed = challengeSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ error: "Challenge data is invalid." }, { status: 400 });
  }

  const inviteCode = randomBytes(4).toString("hex").toUpperCase();
  const sessionUser = await getSessionUser();
  const challenge = await queryOne(
    `insert into challenges (
       title,
       category_id,
       host_name,
       host_id,
       invite_code,
       remind_message,
       duration_days,
       expires_at
     )
     values ($1, $2, $3, $4, $5, $6, $7, now() + make_interval(days => $7))
     returning *`,
    [
      parsed.data.title,
      parsed.data.categoryId ?? null,
      sessionUser?.name ?? parsed.data.hostName,
      sessionUser?.userId ?? null,
      inviteCode,
      parsed.data.remindMessage,
      parsed.data.durationDays,
    ]
  );

  return NextResponse.json(challenge);
}
