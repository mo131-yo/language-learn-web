import { NextResponse } from "next/server";
import { queryOne } from "@/lib/db";
import { subscribeSchema } from "@/lib/validators";

export async function POST(request: Request) {
  const parsed = subscribeSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ error: "Push subscription is invalid." }, { status: 400 });
  }

  const saved = await queryOne(
    `insert into push_subscriptions (member_name, endpoint, p256dh, auth)
     values ($1, $2, $3, $4)
     on conflict (endpoint) do update
       set member_name = excluded.member_name,
           p256dh = excluded.p256dh,
           auth = excluded.auth
     returning id`,
    [
      parsed.data.memberName,
      parsed.data.subscription.endpoint,
      parsed.data.subscription.keys.p256dh,
      parsed.data.subscription.keys.auth
    ]
  );

  return NextResponse.json({ ok: Boolean(saved) });
}
