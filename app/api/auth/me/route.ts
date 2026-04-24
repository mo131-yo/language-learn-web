import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth-helpers";
import { queryOne } from "@/lib/db";

type UserRow = {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  bio: string;
  created_at: string;
};

export async function GET() {
  const session = await getSessionUser();

  if (!session) {
    return NextResponse.json({ user: null });
  }

  const user = await queryOne<UserRow>(
    `
    SELECT id, name, email, avatar, bio, created_at
    FROM users
    WHERE id = $1
    `,
    [session.userId]
  );

  return NextResponse.json({
    user: user ?? null,
  });
}