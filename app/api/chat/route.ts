import { NextResponse } from "next/server";

export const runtime = "nodejs"; // important: don't run on edge

const BASE_URL = process.env.MODEL_RUNNER_BASE_URL ?? "http://localhost:12434";
const MODEL = process.env.MODEL_RUNNER_MODEL ?? "ai/smollm2";

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    if (!Array.isArray(messages)) {
      return NextResponse.json({ error: "messages must be an array" }, { status: 400 });
    }

    const upstream = await fetch(
      `${BASE_URL}/engines/llama.cpp/v1/chat/completions`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: MODEL,
          messages,
          // optional knobs (depends on runner/model):
          temperature: 0.7,
          max_tokens: 256,
          stream: false,
        }),
      }
    );

    const data = await upstream.json();
    return NextResponse.json(data, { status: upstream.status });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}
