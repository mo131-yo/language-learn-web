import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { queryOne } from "@/lib/db";
import { signToken, COOKIE_NAME, COOKIE_MAX_AGE } from "@/lib/auth-helpers";

type UserRow = {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  avatar: string | null;
  bio: string;
};

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const email =
      typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password =
      typeof body.password === "string" ? body.password : "";

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email эсвэл нууц үг дутуу байна" },
        { status: 400 }
      );
    }

    const user = await queryOne<UserRow>(
      `
      SELECT id, name, email, password_hash, avatar, bio
      FROM users
      WHERE LOWER(email) = LOWER($1)
      `,
      [email]
    );

    if (!user) {
      return NextResponse.json(
        {
          error: "Таны оруулсан email хаяг бүртгэлгүй байна.",
          code: "USER_NOT_FOUND",
        },
        { status: 404 }
      );
    }

    const ok = await bcrypt.compare(password, user.password_hash);

    if (!ok) {
      return NextResponse.json(
        {
          error: "Нууц үг буруу байна.",
          code: "INVALID_PASSWORD",
        },
        { status: 401 }
      );
    }

    const token = signToken({
      userId: user.id,
      name: user.name,
      email: user.email,
    });

    const res = NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      bio: user.bio,
    });

    res.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: COOKIE_MAX_AGE,
      path: "/",
    });

    return res;
  } catch (err) {
    console.error("[login]", err);

    return NextResponse.json(
      { error: "Серверийн алдаа" },
      { status: 500 }
    );
  }
}
