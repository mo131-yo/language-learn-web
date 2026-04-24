import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth-helpers";
import { queryOne } from "@/lib/db";

type UserRow = {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  bio: string;
};

export async function PATCH(req: Request) {
  try {
    const session = await getSessionUser();

    if (!session) {
      return NextResponse.json(
        { error: "Нэвтрээгүй байна" },
        { status: 401 }
      );
    }

    const body = await req.json();

    const bio =
      typeof body.bio === "string" ? body.bio.slice(0, 500) : "";
    const avatar =
      typeof body.avatar === "string" || body.avatar === null
        ? body.avatar
        : null;

    const user = await queryOne<UserRow>(
      `
      UPDATE users
      SET bio = $1,
          avatar = $2,
          updated_at = NOW()
      WHERE id = $3
      RETURNING id, name, email, avatar, bio
      `,
      [bio, avatar, session.userId]
    );

    return NextResponse.json({ user });
  } catch (err) {
    console.error("[profile]", err);

    return NextResponse.json(
      { error: "Серверийн алдаа" },
      { status: 500 }
    );
  }
}