import { NextResponse } from "next/server";
import { queryOne } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  const { name, password } = await req.json();
  if (!name?.trim() || !password) return NextResponse.json({ error: "Талбар дутуу байна" }, { status: 400 });
  const exists = await queryOne("SELECT id FROM users WHERE name=$1", [name.trim()]);
  if (exists) return NextResponse.json({ error: "Энэ нэр бүртгэлтэй байна" }, { status: 409 });
  const hash = await bcrypt.hash(password, 10);
  const user = await queryOne("INSERT INTO users (name, password_hash) VALUES ($1,$2) RETURNING id, name", [name.trim(), hash]);
  return NextResponse.json(user);
}