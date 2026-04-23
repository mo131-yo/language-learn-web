// import { NextResponse } from "next/server";
// import { queryOne } from "@/lib/db";
// import { wordSchema } from "@/lib/validators";

// export async function POST(request: Request) {
//   const parsed = wordSchema.safeParse(await request.json());

//   if (!parsed.success) {
//     return NextResponse.json({ error: "Word data is invalid." }, { status: 400 });
//   }

//   const word = await queryOne(
//     `insert into words (term, meaning, example, category_id, author_name)
//      values ($1, $2, $3, $4, $5)
//      returning *`,
//     [
//       parsed.data.term,
//       parsed.data.meaning,
//       parsed.data.example,
//       parsed.data.categoryId ?? null,
//       parsed.data.authorName
//     ]
//   );

//   return NextResponse.json(word);
// }



import { NextResponse } from "next/server";
import { queryOne } from "@/lib/db";
import { wordSchema } from "@/lib/validators";
import jwt from "jsonwebtoken";

export async function POST(request: Request) {
  const parsed = wordSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Word data is invalid." }, { status: 400 });
  }

  let authorName = parsed.data.authorName || "Anonymous";
  let userId = null;

  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    try {
      const token = authHeader.slice(7);
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
      const user = await queryOne("SELECT name FROM users WHERE id = $1", [decoded.userId]);
      if (user) {
        authorName = user.name;
        userId = decoded.userId;
      }
    } catch {
      /* invalid token, ignore */
    }
  }

  const word = await queryOne(
    `insert into words (term, meaning, example, category_id, author_name, user_id)
     values ($1, $2, $3, $4, $5, $6)
     returning *`,
    [
      parsed.data.term,
      parsed.data.meaning,
      parsed.data.example,
      parsed.data.categoryId ?? null,
      authorName,
      userId,
    ]
  );

  return NextResponse.json(word);
}