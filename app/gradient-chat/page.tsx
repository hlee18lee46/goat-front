"use client";

import { useMemo, useRef, useState } from "react";
import { AppHeader } from "@/components/app-header";

type ChatMsg = { role: "user" | "assistant"; content: string };

type GradientChatInput = {
  prompt: string;
  system?: string | null;
  model?: string | null;
  max_tokens?: number;
  temperature?: number;
};

type GradientChatResponse = { ok: true; text: string } | { detail?: any };

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_BASE ?? "http://127.0.0.1:8005";

function stringifyDetail(detail: any) {
  if (!detail) return "Unknown error";
  if (typeof detail === "string") return detail;
  if (detail.message) return String(detail.message);
  try {
    return JSON.stringify(detail);
  } catch {
    return String(detail);
  }
}

export default function GradientChatPage() {
  // Defaults match your backend env defaults: GRADIENT_TEXT_MODEL="llama3-8b-instruct"
  const [model, setModel] = useState("llama3-8b-instruct");
  const [temperature, setTemperature] = useState(0.2);
  const [maxTokens, setMaxTokens] = useState(600);

  const [system, setSystem] = useState(
    "You are a concise, helpful assistant."
  );

  const [messages, setMessages] = useState<ChatMsg[]>([
    { role: "assistant", content: "Hi! Ask me anything (powered by DigitalOcean Gradient)." },
  ]);

  const [input, setInput] = useState("Suggest vibe music params for lofi studying.");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");

  const bottomRef = useRef<HTMLDivElement | null>(null);
  const canSend = useMemo(() => input.trim().length > 0 && !busy, [input, busy]);

  function scrollToBottom() {
    requestAnimationFrame(() =>
      bottomRef.current?.scrollIntoView({ behavior: "smooth" })
    );
  }

  function buildPrompt(history: ChatMsg[]) {
    // Simple, reliable: include a short window of context.
    const last = history.slice(-12);
    return last
      .map((m) => (m.role === "user" ? `User: ${m.content}` : `Assistant: ${m.content}`))
      .join("\n");
  }

  async function send() {
    if (!canSend) return;

    const userText = input.trim();
    setInput("");
    setBusy(true);
    setStatus("Thinking...");

    const next = [...messages, { role: "user", content: userText }];
    setMessages(next);
    scrollToBottom();

    try {
      const payload: GradientChatInput = {
        prompt: buildPrompt(next),
        system: system?.trim() || undefined,
        model: model?.trim() || undefined,
        max_tokens: maxTokens,
        temperature,
      };

      const res = await fetch(`${BACKEND}/ai/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const ct = res.headers.get("content-type") || "";
        if (ct.includes("application/json")) {
          const j = await res.json().catch(() => ({}));
          throw new Error(stringifyDetail(j?.detail ?? j));
        }
        const t = await res.text().catch(() => "");
        throw new Error(t || `Request failed (${res.status})`);
      }

      const data: GradientChatResponse = await res.json();
      const text = (data as any)?.text ?? "(empty response)";

      setMessages((prev) => [...prev, { role: "assistant", content: text }]);
      setStatus("Done ✅");
      scrollToBottom();
    } catch (e: any) {
      const msg = e?.message || "Unknown error";
      setMessages((prev) => [...prev, { role: "assistant", content: `❌ ${msg}` }]);
      setStatus(`Error: ${msg}`);
      scrollToBottom();
    } finally {
      setBusy(false);
      setTimeout(() => setStatus(""), 1500);
    }
  }

  return (
<div className="min-h-screen bg-black text-gray-100">
      <AppHeader
        title={<>Gradient <span className="text-blue-600">Chat</span></>}
        subtitle={`Backend: ${BACKEND}/ai/chat`}
      />

      <main className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* SETTINGS */}
          <div className="space-y-4 rounded-xl border bg-zinc-900 border-zinc-800 p-5 shadow-sm">
            <h2 className="text-lg font-bold">Settings</h2>

            <div className="space-y-2">
              <label className="text-sm font-medium">Model</label>
              <input
                className="w-full rounded border p-2"
                value={model}
                onChange={(e) => setModel(e.target.value)}
              />
              <p className="text-xs text-gray-500">
                Default is <code className="rounded bg-gray-100 px-1">llama3-8b-instruct</code> (from GRADIENT_TEXT_MODEL).
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Temperature: {temperature.toFixed(2)}
              </label>
              <input
                type="range"
                min={0}
                max={2}
                step={0.01}
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Max tokens</label>
              <input
                type="number"
                min={1}
                max={4096}
                value={maxTokens}
                onChange={(e) => setMaxTokens(parseInt(e.target.value || "600", 10))}
                className="w-full rounded border p-2"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">System</label>
              <textarea
                className="h-32 w-full rounded border p-2 text-sm"
                value={system}
                onChange={(e) => setSystem(e.target.value)}
              />
            </div>

            <button
              className="w-full rounded-lg border p-2 hover:bg-gray-50"
              onClick={() => {
                setMessages([{ role: "assistant", content: "Chat cleared. Ask me anything!" }]);
                setStatus("");
              }}
              disabled={busy}
            >
              Clear chat
            </button>
          </div>

          {/* CHAT */}
          <div className="lg:col-span-2 rounded-xl border bg-zinc-900 border-zinc-800 shadow-sm flex flex-col overflow-hidden">
            <div className="border-b p-4 flex items-center justify-between">
              <h2 className="font-bold">Conversation</h2>
              <div className="text-xs text-gray-500">{busy ? "Running..." : status}</div>
            </div>

            <div className="flex-1 overflow-auto p-4 space-y-3">
              {messages.map((m, idx) => (
                <div
                  key={idx}
                  className={`max-w-[85%] rounded-xl px-3 py-2 text-sm whitespace-pre-wrap ${
                    m.role === "user"
                      ? "ml-auto bg-blue-600 text-white"
                      : "mr-auto bg-gray-100 text-gray-900"
                  }`}
                >
                  {m.content}
                </div>
              ))}
              <div ref={bottomRef} />
            </div>

            <div className="border-t p-3">
              <div className="flex gap-2">
                <textarea
                  className="flex-1 rounded border p-2 text-sm"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type your message…"
                  disabled={busy}
                  rows={2}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      send();
                    }
                  }}
                />
                <button
                  onClick={send}
                  disabled={!canSend}
                  className={`rounded-lg px-4 py-2 font-bold text-white ${
                    canSend ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-400 cursor-not-allowed"
                  }`}
                >
                  Send
                </button>
              </div>
              <p className="mt-2 text-xs text-gray-400">
                Enter = send • Shift+Enter = newline
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
