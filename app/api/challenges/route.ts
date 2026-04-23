import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { queryOne } from "@/lib/db";
import { challengeSchema } from "@/lib/validators";

export async function POST(request: Request) {
  const parsed = challengeSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ error: "Challenge data is invalid." }, { status: 400 });
  }

  const inviteCode = randomBytes(4).toString("hex").toUpperCase();
  const challenge = await queryOne(
    `insert into challenges (title, category_id, host_name, invite_code, remind_message)
     values ($1, $2, $3, $4, $5)
     returning *`,
    [
      parsed.data.title,
      parsed.data.categoryId ?? null,
      parsed.data.hostName,
      inviteCode,
      parsed.data.remindMessage
    ]
  );

  return NextResponse.json(challenge);
}
