import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

type Msg = { role: "system" | "user" | "assistant"; content: string };

const CONTEXT_SIZE = 3; // ✅ most recent 3 messages only

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const incoming: Msg[] = body.messages ?? [];
    const sessionId: string | null = body.sessionId ?? null;

    if (!incoming.length) {
      return NextResponse.json({ error: "messages required" }, { status: 400 });
    }

    // Connect Mongo
    const client = await clientPromise;
    const db = client.db(process.env.MONGO_DB_NAME || "vibe");
    const sessions = db.collection("chat_sessions");

    // Find or create session
    let _id: ObjectId;

    if (sessionId) {
      _id = new ObjectId(sessionId);
    } else {
      const system =
        incoming.find((m) => m.role === "system") ??
        ({ role: "system", content: "You are a helpful assistant." } as Msg);

      const created = await sessions.insertOne({
        createdAt: new Date(),
        updatedAt: new Date(),
        systemPrompt: system.content,
        messages: [],
      });

      _id = created.insertedId;
    }

    const session = await sessions.findOne({ _id });
    if (!session) {
      return NextResponse.json({ error: "session not found" }, { status: 404 });
    }

    const systemPrompt: Msg = { role: "system", content: session.systemPrompt };

    // ✅ context = last 3 stored messages (user/assistant)
    const history: Msg[] = (session.messages ?? []).slice(-CONTEXT_SIZE);

    // newest user message from incoming payload
    const lastUser = [...incoming].reverse().find((m) => m.role === "user");
    if (!lastUser) {
      return NextResponse.json({ error: "no user message" }, { status: 400 });
    }

    const modelMessages: Msg[] = [systemPrompt, ...history, lastUser];

    // ✅ Call your model (OpenAI-compatible)
    const base = process.env.LLM_BASE_URL; // e.g. http://127.0.0.1:8001
    if (!base) {
      return NextResponse.json({ error: "Missing LLM_BASE_URL" }, { status: 500 });
    }

    const modelRes = await fetch(`${base}/engines/llama.cpp/v1/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: process.env.LLM_MODEL || "smollm2",
        messages: modelMessages,
        temperature: 0.7,
      }),
    });

    const data = await modelRes.json();

    const reply =
      data?.choices?.[0]?.message?.content ??
      data?.choices?.[0]?.text ??
      "(no reply)";

    // Save user + assistant messages
    await sessions.updateOne(
      { _id },
      {
        $push: {
          messages: {
            $each: [
              { role: "user", content: lastUser.content, at: new Date() },
              { role: "assistant", content: reply, at: new Date() },
            ],
          },
        },
        $set: { updatedAt: new Date() },
      }
    );

    return NextResponse.json({
      sessionId: _id.toString(), // ✅ return to client
      choices: [{ message: { content: reply } }],
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "server error" }, { status: 500 });
  }
}
