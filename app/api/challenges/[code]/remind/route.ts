import { NextResponse } from "next/server";
import webpush from "web-push";
import { configurePush } from "@/lib/push";
import { query } from "@/lib/db";

type SubscriptionRow = {
  endpoint: string;
  p256dh: string;
  auth: string;
  remind_message: string;
  title: string;
};

export async function POST(_request: Request, context: { params: Promise<{ code: string }> }) {
  const pushReady = configurePush();

  if (!pushReady) {
    return NextResponse.json(
      { error: "VAPID keys are missing. Add NEXT_PUBLIC_VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY." },
      { status: 400 }
    );
  }

  const { code } = await context.params;
  const subscriptions = await query<SubscriptionRow>(
    `select ps.endpoint, ps.p256dh, ps.auth, ch.remind_message, ch.title
     from challenges ch
     join challenge_members cm on cm.challenge_id = ch.id
     join push_subscriptions ps on lower(ps.member_name) = lower(cm.display_name)
     where ch.invite_code = $1`,
    [code.toUpperCase()]
  );

  await Promise.allSettled(
    subscriptions.map((row) =>
      webpush.sendNotification(
        {
          endpoint: row.endpoint,
          keys: { p256dh: row.p256dh, auth: row.auth }
        },
        JSON.stringify({
          title: `Words challenge: ${row.title}`,
          body: row.remind_message,
          url: "/"
        })
      )
    )
  );

  return NextResponse.json({ sent: subscriptions.length });
}
