import { NextResponse } from "next/server";
import { queryOne } from "@/lib/db";
import { masterySchema } from "@/lib/validators";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const parsed = masterySchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ error: "Mastery must be between 0 and 5." }, { status: 400 });
  }

  const { id } = await context.params;
  const word = await queryOne("update words set mastery = $1 where id = $2 returning *", [
    parsed.data.mastery,
    id
  ]);

  if (!word) {
    return NextResponse.json({ error: "Word not found." }, { status: 404 });
  }

  return NextResponse.json(word);
}
