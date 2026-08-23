import OpenAI from "openai";
import { NextResponse } from "next/server";

class MissingOpenAIKeyError extends Error {
  constructor() {
    super("OPENAI_KEY is not configured.");
    this.name = "MissingOpenAIKeyError";
  }
}

let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  const apiKey = process.env.OPENAI_KEY ?? process.env.OPENAI_API_KEY;
  if (!apiKey) throw new MissingOpenAIKeyError();
  openaiClient ??= new OpenAI({ apiKey });
  return openaiClient;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const text = typeof body.text === "string" ? body.text.trim() : "";

    if (!text) {
      return NextResponse.json({ error: "Орчуулах текст дутуу байна" }, { status: 400 });
    }

    const client = getOpenAIClient();

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You translate English text to natural, fluent Mongolian (Cyrillic script). Reply with ONLY the Mongolian translation, no explanation, no quotes.",
        },
        { role: "user", content: text.slice(0, 2000) },
      ],
      temperature: 0.3,
    });

    const translation = completion.choices[0]?.message?.content?.trim() ?? "";

    return NextResponse.json({ translation });
  } catch (error) {
    if (error instanceof MissingOpenAIKeyError) {
      return NextResponse.json(
        { error: "Орчуулгын үйлчилгээ тохируулагдаагүй байна. (OPENAI_KEY missing)" },
        { status: 503 }
      );
    }
    console.error("Translate selection API error:", error);
    return NextResponse.json({ error: "Орчуулга авч чадсангүй" }, { status: 500 });
  }
}
