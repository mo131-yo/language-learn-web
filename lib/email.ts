import { Resend } from "resend";

let client: Resend | null = null;

function getClient() {
  if (!process.env.RESEND_API_KEY) return null;
  client ??= new Resend(process.env.RESEND_API_KEY);
  return client;
}

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  const resend = getClient();

  if (!resend) {
    console.warn(
      "[email] RESEND_API_KEY тохируулаагүй тул нууц үг сэргээх имэйл илгээгдсэнгүй."
    );
    return;
  }

  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev",
    to,
    subject: "Нууц үг сэргээх хүсэлт",
    html: `
      <p>Сайн байна уу,</p>
      <p>Нууц үгээ сэргээх хүсэлт ирсэн тул доорх линк дээр дарж шинэ нууц үгээ тохируулна уу:</p>
      <p><a href="${resetUrl}">${resetUrl}</a></p>
      <p>Энэ линк 1 цагийн дараа хүчингүй болно. Хэрэв та энэ хүсэлтийг илгээгээгүй бол энэ имэйлийг үл тоомсорлоно уу.</p>
    `,
  });
}
