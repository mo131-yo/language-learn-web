import { NextResponse } from "next/server";
import { queryOne } from "@/lib/db";
import { getSessionUser } from "@/lib/auth-helpers";
import { subscribeSchema } from "@/lib/validators";

export async function POST(request: Request) {
  const parsed = subscribeSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ error: "Push subscription is invalid." }, { status: 400 });
  }

  const sessionUser = await getSessionUser();
  const memberName = sessionUser?.name ?? parsed.data.memberName;
  const userId = sessionUser?.userId ?? null;

  const saved = await queryOne(
    `insert into push_subscriptions (member_name, user_id, endpoint, p256dh, auth, updated_at)
     values ($1, $2, $3, $4, $5, now())
     on conflict (endpoint) do update
       set member_name = excluded.member_name,
           user_id = coalesce(excluded.user_id, push_subscriptions.user_id),
           p256dh = excluded.p256dh,
           auth = excluded.auth,
           updated_at = now()
     returning id`,
    [
      memberName,
      userId,
      parsed.data.subscription.endpoint,
      parsed.data.subscription.keys.p256dh,
      parsed.data.subscription.keys.auth
    ]
  );

  return NextResponse.json({ ok: Boolean(saved) });
}
