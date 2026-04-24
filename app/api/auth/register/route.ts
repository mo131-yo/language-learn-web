import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { queryOne } from "@/lib/db";
import { signToken, COOKIE_NAME, COOKIE_MAX_AGE } from "@/lib/auth-helpers";

type UserRow = {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  bio: string;
};

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const name = typeof body.name === "string" ? body.name.trim() : "";
    const email =
      typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password =
      typeof body.password === "string" ? body.password : "";

    if (name.length < 2) {
      return NextResponse.json(
        { error: "Нэр дор хаяж 2 тэмдэгт байна" },
        { status: 400 }
      );
    }

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { error: "Зөв email оруулна уу" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Нууц үг дор хаяж 8 тэмдэгт байна" },
        { status: 400 }
      );
    }

    const exists = await queryOne<{ id: string }>(
      "SELECT id FROM users WHERE LOWER(email) = LOWER($1)",
      [email]
    );

    if (exists) {
      return NextResponse.json(
        { error: "Энэ email аль хэдийн бүртгэлтэй байна" },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await queryOne<UserRow>(
      `
      INSERT INTO users (name, email, password_hash)
      VALUES ($1, $2, $3)
      RETURNING id, name, email, avatar, bio
      `,
      [name, email, passwordHash]
    );

    if (!user) {
      return NextResponse.json(
        { error: "Бүртгэл үүсгэж чадсангүй" },
        { status: 500 }
      );
    }

    const token = signToken({
      userId: user.id,
      name: user.name,
      email: user.email,
    });

    const res = NextResponse.json(
      {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        bio: user.bio,
      },
      { status: 201 }
    );

    res.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: COOKIE_MAX_AGE,
      path: "/",
    });

    return res;
  } catch (err) {
    console.error("[register]", err);

    return NextResponse.json(
      { error: "Серверийн алдаа" },
      { status: 500 }
    );
  }
}