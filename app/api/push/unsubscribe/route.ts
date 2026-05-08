import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth-helpers";
import { queryOne } from "@/lib/db";

export async function POST(request: Request) {
  const sessionUser = await getSessionUser();

  if (!sessionUser) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    endpoint?: unknown;
  };
  const endpoint = typeof body.endpoint === "string" ? body.endpoint : "";

  if (endpoint) {
    await queryOne(
      "delete from push_subscriptions where endpoint = $1 and user_id = $2 returning id",
      [endpoint, sessionUser.userId]
    );
  }

  await queryOne(
    `insert into user_app_state (user_id, state_key, state_value, updated_at)
     values ($1, 'vocab-reminders', '{"enabled":false}'::jsonb, now())
     on conflict (user_id, state_key) do update
       set state_value = jsonb_set(user_app_state.state_value, '{enabled}', 'false'::jsonb, true),
           updated_at = now()
     returning user_id`,
    [sessionUser.userId]
  );

  return NextResponse.json({ ok: true });
}
