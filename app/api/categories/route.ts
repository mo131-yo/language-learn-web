import { NextResponse } from "next/server";
import { queryOne } from "@/lib/db";
import { categorySchema } from "@/lib/validators";

export async function POST(request: Request) {
  const parsed = categorySchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ error: "Category name or color is invalid." }, { status: 400 });
  }

  const category = await queryOne(
    `insert into categories (name, color)
     values ($1, $2)
     on conflict (name) do update set color = excluded.color
     returning *`,
    [parsed.data.name, parsed.data.color]
  );

  return NextResponse.json(category);
}
