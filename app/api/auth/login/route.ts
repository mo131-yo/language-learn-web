import { NextResponse } from "next/server";
import { queryOne } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  const { name, password } = await req.json();
  const user = await queryOne("SELECT * FROM users WHERE name=$1", [name?.trim()]);
  if (!user || !(await bcrypt.compare(password, user.password_hash)))
    return NextResponse.json({ error: "Нэр эсвэл нууц үг буруу байна" }, { status: 401 });
  return NextResponse.json({ id: user.id, name: user.name });
}