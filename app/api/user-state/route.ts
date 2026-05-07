import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth-helpers";
import { query, queryOne } from "@/lib/db";

type StateRow = {
  state_key: string;
  state_value: unknown;
};

function isValidStateKey(key: unknown): key is string {
  return (
    typeof key === "string" &&
    key.length > 0 &&
    key.length <= 80 &&
    /^[a-z0-9:_-]+$/i.test(key)
  );
}

export async function GET(request: NextRequest) {
  const sessionUser = await getSessionUser();

  if (!sessionUser) {
    return NextResponse.json({ state: null }, { status: 401 });
  }

  const key = request.nextUrl.searchParams.get("key");

  if (key && !isValidStateKey(key)) {
    return NextResponse.json({ error: "Invalid state key." }, { status: 400 });
  }

  const rows = await query<StateRow>(
    key
      ? `select state_key, state_value
         from user_app_state
         where user_id = $1 and state_key = $2`
      : `select state_key, state_value
         from user_app_state
         where user_id = $1`,
    key ? [sessionUser.userId, key] : [sessionUser.userId]
  );

  const state = Object.fromEntries(
    rows.map((row) => [row.state_key, row.state_value])
  );

  return NextResponse.json({ state });
}

export async function PUT(request: Request) {
  const sessionUser = await getSessionUser();

  if (!sessionUser) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);

  if (!body || !isValidStateKey(body.key)) {
    return NextResponse.json({ error: "Invalid state key." }, { status: 400 });
  }

  const value = body.value ?? null;

  const row = await queryOne<StateRow>(
    `insert into user_app_state (user_id, state_key, state_value, updated_at)
     values ($1, $2, $3::jsonb, now())
     on conflict (user_id, state_key)
     do update set state_value = excluded.state_value, updated_at = now()
     returning state_key, state_value`,
    [sessionUser.userId, body.key, JSON.stringify(value)]
  );

  return NextResponse.json(row);
}
