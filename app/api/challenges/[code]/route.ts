import { NextResponse } from "next/server";
import { queryOne } from "@/lib/db";
import { getSessionUser } from "@/lib/auth-helpers";

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ code: string }> }
) {
  const sessionUser = await getSessionUser();

  if (!sessionUser) {
    return NextResponse.json({ error: "Нэвтэрч орно уу." }, { status: 401 });
  }

  const { code } = await context.params;
  const challenge = await queryOne<{ id: string; host_id: string | null }>(
    `select id, host_id
     from challenges
     where invite_code = $1`,
    [code.toUpperCase()]
  );

  if (!challenge) {
    return NextResponse.json(
      { error: "Сорилт олдсонгүй." },
      { status: 404 }
    );
  }

  if (!challenge.host_id || challenge.host_id !== sessionUser.userId) {
    return NextResponse.json(
      { error: "Зөвхөн үүсгэсэн хэрэглэгч устгах боломжтой." },
      { status: 403 }
    );
  }

  await queryOne(
    `delete from challenges
     where id = $1
     returning id`,
    [challenge.id]
  );

  return NextResponse.json({ ok: true });
}
