import { NextResponse } from "next/server";
import webpush from "web-push";
import { query, queryOne } from "@/lib/db";
import { configurePush } from "@/lib/push";

type ReminderStateRow = {
  user_id: string;
  state_value: {
    enabled?: boolean;
    intervalMinutes?: number;
    lastSentAt?: number;
    lastWordId?: string;
  };
};

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

async function getRandomWord(userId: string, lastWordId?: string) {
  const word = await queryOne<ReminderWord>(
    `select w.id, w.term, w.meaning
     from words w
     where (w.author_id = $1
        or exists (
          select 1 from user_word_mastery uwm
          where uwm.user_id = $1 and uwm.word_id = w.id
        ))
       and ($2::uuid is null or w.id <> $2::uuid)
     order by random()
     limit 1`,
    [userId, lastWordId || null]
  );

  if (word) return word;

  return queryOne<ReminderWord>(
    `select w.id, w.term, w.meaning
     from words w
     where w.author_id = $1
        or exists (
          select 1 from user_word_mastery uwm
          where uwm.user_id = $1 and uwm.word_id = w.id
        )
     order by random()
     limit 1`,
    [userId]
  );
}

export async function POST() {
  if (!configurePush()) {
    return NextResponse.json(
      { error: "VAPID keys are missing. Add NEXT_PUBLIC_VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY." },
      { status: 400 }
    );
  }

  const now = Date.now();
  const rows = await query<ReminderStateRow>(
    `select user_id, state_value
     from user_app_state
     where state_key = 'vocab-reminders'
       and coalesce((state_value->>'enabled')::boolean, false) = true`
  );

  let checked = 0;
  let sent = 0;
  let skipped = 0;

  for (const row of rows) {
    checked += 1;

    const intervalMinutes = Math.max(Number(row.state_value.intervalMinutes) || 5, 5);
    const lastSentAt = Number(row.state_value.lastSentAt) || 0;

    if (lastSentAt && now - lastSentAt < intervalMinutes * 60 * 1000) {
      skipped += 1;
      continue;
    }

    const word = await getRandomWord(row.user_id, row.state_value.lastWordId);

    if (!word) {
      skipped += 1;
      continue;
    }

    const subscriptions = await query<SubscriptionRow>(
      "select endpoint, p256dh, auth from push_subscriptions where user_id = $1",
      [row.user_id]
    );

    if (subscriptions.length === 0) {
      skipped += 1;
      continue;
    }

    let sentForUser = 0;

    await Promise.allSettled(
      subscriptions.map(async (subscription) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: subscription.endpoint,
              keys: { p256dh: subscription.p256dh, auth: subscription.auth },
            },
            JSON.stringify({
              title: "Үгээ давтах цаг боллоо",
              body: notificationBody(word),
              tag: "vocab-reminder",
              url: "/?view=learn",
            })
          );
          sentForUser += 1;
        } catch (error) {
          const statusCode =
            typeof error === "object" && error && "statusCode" in error
              ? (error as { statusCode?: number }).statusCode
              : undefined;

          if (statusCode === 404 || statusCode === 410) {
            await queryOne("delete from push_subscriptions where endpoint = $1 returning id", [
              subscription.endpoint,
            ]);
          }
        }
      })
    );

    if (sentForUser > 0) {
      sent += sentForUser;
      await queryOne(
        `update user_app_state
         set state_value =
           jsonb_set(
             jsonb_set(state_value, '{lastSentAt}', to_jsonb($2::bigint), true),
             '{lastWordId}', to_jsonb($3::text), true
           ),
           updated_at = now()
         where user_id = $1 and state_key = 'vocab-reminders'
         returning user_id`,
        [row.user_id, now, word.id]
      );
    } else {
      skipped += 1;
    }
  }

  return NextResponse.json({ checked, sent, skipped });
}

export async function GET() {
  return POST();
}
