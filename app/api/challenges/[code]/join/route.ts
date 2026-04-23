import { NextResponse } from "next/server";
import { queryOne } from "@/lib/db";
import { joinChallengeSchema } from "@/lib/validators";

export async function POST(request: Request, context: { params: Promise<{ code: string }> }) {
  const parsed = joinChallengeSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ error: "Display name is invalid." }, { status: 400 });
  }

  const { code } = await context.params;
  const member = await queryOne(
    `insert into challenge_members (challenge_id, display_name)
     select id, $1 from challenges where invite_code = $2
     on conflict (challenge_id, display_name) do nothing
     returning *`,
    [parsed.data.displayName, code.toUpperCase()]
  );

  return NextResponse.json({ ok: Boolean(member) });
}
