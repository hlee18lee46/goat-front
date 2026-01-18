"use client";

import { useState } from "react";
import { AppHeader } from "@/components/app-header"; // ✅ correct import

type Msg = { role: "system" | "user" | "assistant"; content: string };

export default function Page() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "system",
      content:
        "You are a helpful assistant. Vibe-Composer is a web application users can use to compose midi files and use gradient ai (llama) to generate midi song file.",
    },
  ]);
  const [loading, setLoading] = useState(false);

  async function send() {
    if (!input.trim() || loading) return;

    const next = [...messages, { role: "user", content: input }];
    setMessages(next);
    setInput("");
    setLoading(true);

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: next }),
    });

    const data = await res.json();
    const reply =
      data?.choices?.[0]?.message?.content ??
      data?.choices?.[0]?.text ??
      "(no reply)";

    setMessages([...next, { role: "assistant", content: reply }]);
    setLoading(false);
  }

  return (
    <>
      {/* ✅ HEADER WITH NAV LINKS */}
      <AppHeader
        title="Chat with smollm2"
        subtitle="Local LLM chat (Docker model runner)"
      />

      {/* ⬇️ everything below is unchanged */}
      <main style={{ maxWidth: 800, margin: "40px auto", padding: 16 }}>
        <h1>Local LLM Chat (Docker Model Runner)</h1>

        <div style={{ border: "1px solid #ddd", padding: 12, minHeight: 300 }}>
          {messages
            .filter((m) => m.role !== "system")
            .map((m, i) => (
              <p key={i}>
                <b>{m.role}:</b> {m.content}
              </p>
            ))}
          {loading && (
            <p>
              <b>assistant:</b> …
            </p>
          )}
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <input
            style={{ flex: 1, padding: 10 }}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="Ask something…"
          />
          <button onClick={send} style={{ padding: "10px 16px" }}>
            Send
          </button>
        </div>
      </main>
    </>
  );
}
