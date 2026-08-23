import { NextResponse } from "next/server";
import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { query, queryOne } from "@/lib/db";

type ResetTokenRow = {
  id: string;
  user_id: string;
  expires_at: string;
  used_at: string | null;
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const token = typeof body.token === "string" ? body.token : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (!token) {
      return NextResponse.json(
        { error: "Токен дутуу байна" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Нууц үг дор хаяж 8 тэмдэгт байна", code: "WEAK_PASSWORD" },
        { status: 400 }
      );
    }

    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    const record = await queryOne<ResetTokenRow>(
      "SELECT id, user_id, expires_at, used_at FROM password_reset_tokens WHERE token_hash = $1",
      [tokenHash]
    );

    if (!record || record.used_at || new Date(record.expires_at) < new Date()) {
      return NextResponse.json(
        { error: "Линк хүчингүй эсвэл хугацаа дууссан байна", code: "INVALID_TOKEN" },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await query(
      "UPDATE users SET password_hash = $1, updated_at = now() WHERE id = $2",
      [passwordHash, record.user_id]
    );

    await query(
      "UPDATE password_reset_tokens SET used_at = now() WHERE id = $1",
      [record.id]
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[reset-password]", err);

    return NextResponse.json(
      { error: "Серверийн алдаа" },
      { status: 500 }
    );
  }
}
