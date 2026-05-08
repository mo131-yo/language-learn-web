import { NextResponse } from "next/server";
import webpush from "web-push";
import { getSessionUser } from "@/lib/auth-helpers";
import { query, queryOne } from "@/lib/db";
import { configurePush } from "@/lib/push";

type SubscriptionRow = {
  endpoint: string;
  p256dh: string;
  auth: string;
};

type ReminderWord = {
  id: string;
  term: string;
  meaning: string | null;
};

function notificationBody(word: ReminderWord) {
  const meaning = word.meaning?.trim();
  return meaning
    ? `${word.term} — ${meaning}`
    : `Энэ үгийг санаж байна уу? ${word.term}`;
}

export async function POST() {
  const sessionUser = await getSessionUser();

  if (!sessionUser) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (!configurePush()) {
    return NextResponse.json(
      { error: "VAPID keys are missing. Add NEXT_PUBLIC_VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY." },
      { status: 400 }
    );
  }

  const word = await queryOne<ReminderWord>(
    `select w.id, w.term, w.meaning
     from words w
     where w.author_id = $1
        or exists (
          select 1 from user_word_mastery uwm
          where uwm.user_id = $1 and uwm.word_id = w.id
        )
     order by random()
     limit 1`,
    [sessionUser.userId]
  );

  if (!word) {
    return NextResponse.json({ error: "Үгийн жагсаалт хоосон байна" }, { status: 400 });
  }

  const subscriptions = await query<SubscriptionRow>(
    "select endpoint, p256dh, auth from push_subscriptions where user_id = $1",
    [sessionUser.userId]
  );

  if (subscriptions.length === 0) {
    return NextResponse.json({ error: "Push subscription олдсонгүй." }, { status: 400 });
  }

  let sent = 0;

  await Promise.allSettled(
    subscriptions.map(async (row) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: row.endpoint,
            keys: { p256dh: row.p256dh, auth: row.auth },
          },
          JSON.stringify({
            title: "Үгээ давтах цаг боллоо",
            body: notificationBody(word),
            tag: "vocab-reminder",
            url: "/?view=learn",
          })
        );
        sent += 1;
      } catch (error) {
        const statusCode =
          typeof error === "object" && error && "statusCode" in error
            ? (error as { statusCode?: number }).statusCode
            : undefined;

        if (statusCode === 404 || statusCode === 410) {
          await queryOne("delete from push_subscriptions where endpoint = $1 returning id", [
            row.endpoint,
          ]);
        }
      }
    })
  );

  return NextResponse.json({ sent });
}
