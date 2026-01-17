"use client";

import { useMemo, useState } from "react";
import { AppHeader } from "@/components/app-header";

const BACKEND = process.env.NEXT_PUBLIC_VIBE_API_BASE ?? "http://127.0.0.1:8010";

const VIBES = ["edm", "lofi", "trap", "cinematic"] as const;
const KEYS = ["C","C#","Db","D","D#","Eb","E","F","F#","Gb","G","G#","Ab","A","A#","Bb","B"] as const;
const MODES = ["major", "minor", "dorian", "mixolydian"] as const;

type Vibe = (typeof VIBES)[number];
type KeyName = (typeof KEYS)[number];
type Mode = (typeof MODES)[number];

export default function VibeComposerPage() {
  // ---- params that match your generator wrapper (vibe_music_composer -> generate_song_bytes_from_dict) ----
  const [name, setName] = useState("vibe_song");
  const [vibe, setVibe] = useState<Vibe>("edm");
  const [key, setKey] = useState<KeyName>("F#");
  const [mode, setMode] = useState<Mode>("minor");
  const [bpm, setBpm] = useState(132);
  const [bars, setBars] = useState(16);
  const [energy, setEnergy] = useState(0.8);
  const [seed, setSeed] = useState<number | "">(42);

  // ---- ui state ----
  const [busy, setBusy] = useState<"" | "midi" | "mp3">("");
  const [status, setStatus] = useState("");
  const [audioUrl, setAudioUrl] = useState<string>("");

  const canRun = useMemo(() => name.trim().length > 0 && busy === "", [name, busy]);

  function buildPayload() {
    return {
      name,
      params: {
        vibe,
        key,
        mode,
        bpm,
        bars,
        energy,
        seed: seed === "" ? 42 : seed,
      },
    };
  }

  async function postBinary(path: string) {
    const res = await fetch(`${BACKEND}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildPayload()),
    });

    if (!res.ok) {
      // FastAPI errors often come as JSON {detail: "..."}; fall back to text
      const ct = res.headers.get("content-type") || "";
      if (ct.includes("application/json")) {
        const j = await res.json().catch(() => ({}));
        const msg = j?.detail ? (typeof j.detail === "string" ? j.detail : JSON.stringify(j.detail)) : "Request failed";
        throw new Error(msg);
      }
      const t = await res.text().catch(() => "");
      throw new Error(t || `Request failed (${res.status})`);
    }

    const blob = await res.blob();
    return blob;
  }

  function triggerDownload(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    // keep url around briefly; caller may want it for audio playback
    return url;
  }

  async function handleMidi() {
    if (!canRun) return;
    setBusy("midi");
    setStatus("Generating MIDI...");
    try {
      const blob = await postBinary("/v1/song/midi");
      triggerDownload(blob, `${name}.mid`);
      setStatus("MIDI downloaded ✅");
    } catch (e: any) {
      setStatus(`Error: ${e.message}`);
    } finally {
      setBusy("");
    }
  }

  async function handleMp3() {
    if (!canRun) return;
    setBusy("mp3");
    setStatus("Rendering MP3...");
    setAudioUrl("");
    try {
      const blob = await postBinary("/v1/song/mp3");
      const url = triggerDownload(blob, `${name}.mp3`);
      setAudioUrl(url); // for <audio> preview
      setStatus("MP3 ready ✅ (downloaded)");
    } catch (e: any) {
      setStatus(`Error: ${e.message}`);
    } finally {
      setBusy("");
    }
  }

  return (
<div className="min-h-screen bg-black text-gray-100">
      <AppHeader
        title={<>Vibe <span className="text-blue-600">Composer</span></>}
        subtitle={`FastAPI backend: ${BACKEND}`}
      />

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* LEFT */}
          <div className="space-y-6 rounded-xl border bg-zinc-900 border-zinc-800 p-6 shadow-sm">
            <h2 className="text-xl font-bold">Parameters</h2>

            <div className="space-y-2">
              <label className="text-sm font-medium">Song name</label>
              <input
                className="w-full rounded border p-2"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Vibe</label>
                <select className="w-full rounded border p-2" value={vibe} onChange={(e) => setVibe(e.target.value as Vibe)}>
                  {VIBES.map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Key</label>
                <select className="w-full rounded border p-2" value={key} onChange={(e) => setKey(e.target.value as KeyName)}>
                  {KEYS.map(k => <option key={k} value={k}>{k}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Mode</label>
                <select className="w-full rounded border p-2" value={mode} onChange={(e) => setMode(e.target.value as Mode)}>
                  {MODES.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">BPM: {bpm}</label>
                <input
                  type="range"
                  min={40}
                  max={220}
                  value={bpm}
                  onChange={(e) => setBpm(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Bars</label>
                <input
                  type="number"
                  min={1}
                  max={64}
                  value={bars}
                  onChange={(e) => setBars(clampInt(e.target.value, 1, 64))}
                  className="w-full rounded border p-2"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Energy: {energy.toFixed(2)}</label>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={energy}
                  onChange={(e) => setEnergy(parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Seed</label>
                <input
                  type="number"
                  value={seed}
                  onChange={(e) => setSeed(e.target.value === "" ? "" : clampInt(e.target.value, 0, 1_000_000))}
                  className="w-full rounded border p-2"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <button
                onClick={handleMidi}
                disabled={!canRun}
                className={`w-full rounded-lg py-3 font-bold text-white transition ${
                  canRun ? "bg-gray-800 hover:bg-gray-900" : "bg-gray-400 cursor-not-allowed"
                }`}
              >
                {busy === "midi" ? "Generating..." : "Generate MIDI"}
              </button>

              <button
                onClick={handleMp3}
                disabled={!canRun}
                className={`w-full rounded-lg py-3 font-bold text-white transition ${
                  canRun ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-400 cursor-not-allowed"
                }`}
              >
                {busy === "mp3" ? "Rendering..." : "Generate MP3"}
              </button>
            </div>

            <p className="text-center text-sm text-gray-500">{status}</p>
          </div>

          {/* RIGHT */}
          <div className="flex flex-col items-center justify-center space-y-6 rounded-xl border border-dashed bg-zinc-900 border-zinc-800 p-6">
            {audioUrl ? (
              <div className="w-full space-y-4">
                <h3 className="text-lg font-semibold text-center">Preview</h3>
                <audio src={audioUrl} controls className="w-full" />
                <p className="text-xs text-gray-400 text-center">
                  If preview fails in VS Code, that’s normal — use a real player. Browser preview should work.
                </p>
              </div>
            ) : (
              <div className="text-center text-gray-400">
                <p>No MP3 yet.</p>
                <p className="text-xs">Click “Generate MP3” to render + download.</p>
              </div>
            )}
          </div>
        </div>

        <p className="mt-6 text-xs text-gray-400">
          Tip: set <code className="rounded bg-gray-100 px-1">NEXT_PUBLIC_VIBE_API_BASE</code> in <code className="rounded bg-gray-100 px-1">.env.local</code> to point to your FastAPI server.
        </p>
      </main>
    </div>
  );
}

function clampInt(v: string, min: number, max: number) {
  const n = parseInt(v || "0", 10);
  if (Number.isNaN(n)) return min;
  return Math.max(min, Math.min(max, n));
}
