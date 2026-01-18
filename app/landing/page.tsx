"use client";

import Link from "next/link";
import { AppHeader } from "@/components/app-header";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-black text-gray-100">
      <AppHeader
        title={
          <>
            Vibe <span className="text-blue-600">Composer</span>
          </>
        }
        subtitle="Compose MIDI music with AI, experiment with Gradient models, and chat with local LLMs."
      />

      <main className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto grid gap-10">

          {/* HERO */}
          <section className="text-center space-y-4">
            <p className="text-lg text-gray-400">
              A developer-friendly playground for music generation, AI chat,
              and creative experimentation.
            </p>

            <div className="flex justify-center gap-4 mt-6 flex-wrap">
              <Link
                href="/vibe-composer"
                className="rounded-xl bg-blue-600 px-6 py-3 font-bold text-white hover:bg-blue-700 transition"
              >
                🎵 Compose Music
              </Link>

              <Link
                href="/gradient-chat"
                className="rounded-xl border border-gray-700 px-6 py-3 font-bold hover:bg-gray-900 transition"
              >
                🤖 Gradient Chat
              </Link>

              <Link
                href="/smollm2"
                className="rounded-xl border border-gray-700 px-6 py-3 font-bold hover:bg-gray-900 transition"
              >
                💬 Local LLM Chat
              </Link>
            </div>
          </section>

          {/* FEATURES */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Feature
              title="AI-Generated Music"
              desc="Turn natural language prompts into MIDI compositions and experiment with musical parameters."
            />
            <Feature
              title="Gradient AI"
              desc="Chat with LLaMA models hosted on DigitalOcean Gradient using a clean developer UI."
            />
            <Feature
              title="Local LLMs"
              desc="Run and chat with local models via Docker for privacy-first experimentation."
            />
          </section>

          {/* TECH STACK */}
          <section className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
            <h2 className="text-xl font-bold mb-3">Tech Stack</h2>
            <ul className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm text-gray-300">
              <li>Next.js (App Router)</li>
              <li>FastAPI</li>
              <li>DigitalOcean Gradient</li>
              <li>Local Docker LLMs</li>
              <li>MIDI Generation</li>
              <li>Tailwind CSS</li>
              <li>Python Audio Tooling</li>
              <li>Open Models (LLaMA)</li>
            </ul>
          </section>

          {/* FOOTER */}
          <footer className="text-center text-xs text-gray-500 pt-10">
            Built for experimentation • Hackathon-ready • Developer-first
          </footer>

        </div>
      </main>
    </div>
  );
}

function Feature({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
      <h3 className="font-bold mb-2">{title}</h3>
      <p className="text-sm text-gray-400">{desc}</p>
    </div>
  );
}
