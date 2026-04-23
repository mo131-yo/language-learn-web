import { NextResponse } from "next/server";
import { queryOne } from "@/lib/db";
import { profileSchema } from "@/lib/validators";

export async function POST(request: Request) {
  const parsed = profileSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ error: "Profile data is invalid." }, { status: 400 });
  }

  const profile = await queryOne(
    `insert into profiles (display_name, daily_goal, favorite_category_id, notifications_enabled)
     values ($1, $2, $3, $4)
     on conflict (display_name) do update
       set daily_goal = excluded.daily_goal,
           favorite_category_id = excluded.favorite_category_id,
           notifications_enabled = excluded.notifications_enabled,
           updated_at = now()
     returning *`,
    [
      parsed.data.displayName,
      parsed.data.dailyGoal,
      parsed.data.favoriteCategoryId ?? null,
      parsed.data.notificationsEnabled
    ]
  );

  return NextResponse.json(profile);
}
