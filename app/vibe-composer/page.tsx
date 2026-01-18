"use client";

import { useMemo, useState } from "react";
import { AppHeader } from "@/components/app-header";
import { useWallet } from "@/components/wallet-context"; // ✅ wallet

const BACKEND =
  process.env.NEXT_PUBLIC_VIBE_API_BASE ?? "http://127.0.0.1:8010"; // music api
const GRADIENT_BACKEND =
  process.env.NEXT_PUBLIC_GRADIENT_API_BASE ?? "http://127.0.0.1:8005"; // ai + snowflake api
const REWARD_BACKEND =
  process.env.NEXT_PUBLIC_REWARD_API_BASE ?? "https://sol-render.onrender.com"; // ✅ solana reward api

const VIBES = ["edm", "lofi", "trap", "cinematic"] as const;
const KEYS = [
  "C",
  "C#",
  "Db",
  "D",
  "D#",
  "Eb",
  "E",
  "F",
  "F#",
  "Gb",
  "G",
  "G#",
  "Ab",
  "A",
  "A#",
  "Bb",
  "B",
] as const;
const MODES = ["major", "minor", "dorian", "mixolydian"] as const;

type Vibe = (typeof VIBES)[number];
type KeyName = (typeof KEYS)[number];
type Mode = (typeof MODES)[number];

const MUSIC_JSON_SYSTEM = `
You are a music-parameter generator for a MIDI/MP3 composer.
Return ONLY valid JSON (no markdown, no explanations, no code fences).

Schema:
{
  "name": string,
  "params": {
    "vibe": "edm" | "lofi" | "trap" | "cinematic",
    "key": "C"|"C#"|"Db"|"D"|"D#"|"Eb"|"E"|"F"|"F#"|"Gb"|"G"|"G#"|"Ab"|"A"|"A#"|"Bb"|"B",
    "mode": "major" | "minor" | "dorian" | "mixolydian",
    "bpm": integer,
    "bars": integer,
    "energy": number,
    "seed": integer
  }
}

Rules:
- Always include every field.
- bpm: 60..180 unless user asks otherwise.
- bars: 4..64
- energy: 0..1
- seed: integer
`.trim();

function safeJsonExtract(text: string) {
  try {
    return JSON.parse(text);
  } catch {}
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start >= 0 && end > start) {
    const slice = text.slice(start, end + 1);
    return JSON.parse(slice);
  }
  throw new Error("AI did not return valid JSON");
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function clampInt(v: string, min: number, max: number) {
  const n = parseInt(v || "0", 10);
  if (Number.isNaN(n)) return min;
  return Math.max(min, Math.min(max, n));
}

function asNullIfEmpty(s: string) {
  const t = (s ?? "").trim();
  return t.length ? t : null;
}

function stringifyErr(detail: any) {
  if (!detail) return "Unknown error";
  if (typeof detail === "string") return detail;
  if (detail.error) return String(detail.error);
  if (detail.message) return String(detail.message);
  if (detail.detail) return stringifyErr(detail.detail);
  try {
    return JSON.stringify(detail);
  } catch {
    return String(detail);
  }
}

type RewardResponse =
  | {
      ok: true;
      already_paid: boolean;
      amount_sol?: number;
      from_wallet?: string;
      to_wallet?: string;
      signature?: string;
    }
  | { ok?: false; detail?: any; error?: string };

export default function VibeComposerPage() {
  const { walletAddress } = useWallet(); // ✅ connected wallet (receiver)

  // ---- generator params ----
  const [name, setName] = useState("vibe_song");
  const [vibe, setVibe] = useState<Vibe>("edm");
  const [key, setKey] = useState<KeyName>("F#");
  const [mode, setMode] = useState<Mode>("minor");
  const [bpm, setBpm] = useState(132);
  const [bars, setBars] = useState(16);
  const [energy, setEnergy] = useState(0.8);
  const [seed, setSeed] = useState<number | "">(42);

  // ---- Gradient AI prompt -> JSON ----
  const [aiPrompt, setAiPrompt] = useState(
    "Upbeat synthwave, dreamy chords, 128 bpm, 16 bars, F# minor, high energy"
  );
  const [aiBusy, setAiBusy] = useState(false);
  const [aiStatus, setAiStatus] = useState("");

  // ---- music actions ----
  const [busy, setBusy] = useState<"" | "midi" | "mp3">("");
  const [status, setStatus] = useState("");
  const [audioUrl, setAudioUrl] = useState<string>("");

  // ---- metadata fields (Snowflake save) ----
  const [artist, setArtist] = useState("Han");
  const [publicAudioUrl, setPublicAudioUrl] = useState(""); // PUBLIC https url
  const [midiPublicUrl, setMidiPublicUrl] = useState(""); // optional
  const [videoUrl, setVideoUrl] = useState(""); // optional
  const [coverUrl, setCoverUrl] = useState(""); // optional

  // ---- Save to Snowflake ----
  const [saveBusy, setSaveBusy] = useState(false);
  const [saveStatus, setSaveStatus] = useState("");
  const [savedRowId, setSavedRowId] = useState("");

  // ---- ✅ Reward state ----
  const [rewardBusy, setRewardBusy] = useState(false);
  const [rewardStatus, setRewardStatus] = useState("");
  const [rewardResp, setRewardResp] = useState<RewardResponse | null>(null);

  const canRun = useMemo(
    () => name.trim().length > 0 && busy === "" && !aiBusy && !saveBusy,
    [name, busy, aiBusy, saveBusy]
  );

  function buildMusicPayload() {
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
      body: JSON.stringify(buildMusicPayload()),
    });

    if (!res.ok) {
      const ct = res.headers.get("content-type") || "";
      if (ct.includes("application/json")) {
        const j = await res.json().catch(() => ({}));
        const msg = j?.detail
          ? typeof j.detail === "string"
            ? j.detail
            : JSON.stringify(j.detail)
          : "Request failed";
        throw new Error(msg);
      }
      const t = await res.text().catch(() => "");
      throw new Error(t || `Request failed (${res.status})`);
    }

    return await res.blob();
  }

  function triggerDownload(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
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
      setAudioUrl(url);
      setStatus("MP3 ready ✅ (downloaded)");
    } catch (e: any) {
      setStatus(`Error: ${e.message}`);
    } finally {
      setBusy("");
    }
  }

  async function handleAiFillParams() {
    if (aiBusy) return;
    const promptText = aiPrompt.trim();
    if (!promptText) {
      setAiStatus("Type a prompt first");
      return;
    }

    setAiBusy(true);
    setAiStatus("Asking Gradient AI for JSON...");
    try {
      const res = await fetch(`${GRADIENT_BACKEND}/ai/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: promptText,
          system: MUSIC_JSON_SYSTEM,
          max_tokens: 350,
          temperature: 0.2,
        }),
      });

      if (!res.ok) {
        const ct = res.headers.get("content-type") || "";
        if (ct.includes("application/json")) {
          const j = await res.json().catch(() => ({}));
          const msg = j?.detail
            ? typeof j.detail === "string"
              ? j.detail
              : JSON.stringify(j.detail)
            : "AI request failed";
          throw new Error(msg);
        }
        throw new Error(`AI request failed (${res.status})`);
      }

      const data: any = await res.json();
      const text: string = data?.text ?? "";
      const obj = safeJsonExtract(text);

      const p = obj?.params ?? {};
      const nextName = typeof obj?.name === "string" ? obj.name : undefined;
      if (nextName) setName(nextName);

      if (VIBES.includes(p.vibe)) setVibe(p.vibe);
      if (KEYS.includes(p.key)) setKey(p.key);
      if (MODES.includes(p.mode)) setMode(p.mode);

      if (typeof p.bpm === "number") setBpm(clamp(Math.round(p.bpm), 40, 220));
      if (typeof p.bars === "number") setBars(clamp(Math.round(p.bars), 1, 64));
      if (typeof p.energy === "number") setEnergy(clamp(p.energy, 0, 1));
      if (typeof p.seed === "number")
        setSeed(clamp(Math.round(p.seed), 0, 1_000_000));

      setAiStatus("Params filled ✅");
    } catch (e: any) {
      setAiStatus(`AI Error: ${e.message}`);
    } finally {
      setAiBusy(false);
      setTimeout(() => setAiStatus(""), 1800);
    }
  }

  async function aiThenMidi() {
    await handleAiFillParams();
    setTimeout(() => handleMidi(), 0);
  }

  async function aiThenMp3() {
    await handleAiFillParams();
    setTimeout(() => handleMp3(), 0);
  }

  // ✅ build a stable idempotency key for reward
  function rewardKey() {
    // Prefer savedRowId (unique, stable). Fallback to name+wallet.
    const base = savedRowId
      ? `song_${savedRowId}`
      : `song_${name.trim() || "untitled"}_${walletAddress || "no_wallet"}`;
    return base;
  }

  async function handleReward() {
    if (rewardBusy) return;

    if (!walletAddress) {
      setRewardStatus("Connect wallet first (receiver wallet needed)");
      setTimeout(() => setRewardStatus(""), 2500);
      return;
    }

    setRewardBusy(true);
    setRewardStatus("Sending 0.01 SOL reward...");
    setRewardResp(null);

    try {
      const res = await fetch(`${REWARD_BACKEND}/reward/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receiver_wallet_address: walletAddress,
          amount_sol: 0.01,
          idempotency_key: rewardKey(),
        }),
      });

      const ct = res.headers.get("content-type") || "";
      const data = ct.includes("application/json")
        ? await res.json().catch(() => ({}))
        : { error: await res.text().catch(() => "") };

      if (!res.ok) {
        throw new Error(stringifyErr(data));
      }

      setRewardResp(data);
      setRewardStatus(
        data?.already_paid ? "Already rewarded ✅" : "Reward sent ✅"
      );
    } catch (e: any) {
      setRewardStatus(`Reward Error: ${e?.message ?? String(e)}`);
    } finally {
      setRewardBusy(false);
      setTimeout(() => setRewardStatus(""), 3500);
    }
  }

  async function handleSaveToSnowflake() {
    if (saveBusy) return;

    if (!walletAddress) {
      setSaveStatus("Connect wallet first (needed to save songs per user)");
      setTimeout(() => setSaveStatus(""), 2500);
      return;
    }

    setSaveBusy(true);
    setSaveStatus("Saving to Snowflake...");
    setSavedRowId("");

    try {
      const payload = {
        name: name.trim(),
        artist: artist.trim() || null,

        vibe,
        bpm,
        key,
        mode,
        bars,
        energy,
        seed: seed === "" ? 42 : seed,

        audio_url: asNullIfEmpty(publicAudioUrl),
        midi_url: asNullIfEmpty(midiPublicUrl),
        video_url: asNullIfEmpty(videoUrl),
        cover_url: asNullIfEmpty(coverUrl),

        solana_wallet: walletAddress,
        solana_signature: null,

        audio_sha256: null,
        ai_prompt: asNullIfEmpty(aiPrompt),
      };

      const res = await fetch(`${GRADIENT_BACKEND}/snowflake/song-metadata`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const ct = res.headers.get("content-type") || "";
        if (ct.includes("application/json")) {
          const j = await res.json().catch(() => ({}));
          const msg = j?.detail
            ? typeof j.detail === "string"
              ? j.detail
              : JSON.stringify(j.detail)
            : "Save failed";
          throw new Error(msg);
        }
        const t = await res.text().catch(() => "");
        throw new Error(t || `Save failed (${res.status})`);
      }

      const data = await res.json();
      const rowId = data?.id || data?.inserted_id || "";
      setSavedRowId(rowId);
      setSaveStatus("Saved ✅");

      // ✅ OPTIONAL: auto-reward right after save
      // await handleReward();
    } catch (e: any) {
      setSaveStatus(`Error: ${e.message}`);
    } finally {
      setSaveBusy(false);
      setTimeout(() => setSaveStatus(""), 2500);
    }
  }

  const rewardSig = (rewardResp as any)?.signature as string | undefined;
  const rewardAlready = (rewardResp as any)?.already_paid as boolean | undefined;

  return (
    <div className="min-h-screen bg-black text-gray-100">
      <AppHeader
        title={
          <>
            Vibe <span className="text-blue-600">Composer</span>
          </>
        }
        subtitle={`Music API: ${BACKEND} • AI/Snowflake API: ${GRADIENT_BACKEND} • Reward API: ${REWARD_BACKEND}`}
      />

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* LEFT */}
          <div className="space-y-6 rounded-xl border border-zinc-800 bg-zinc-900 p-6 shadow-sm">
            {/* GRADIENT AI */}
            <div className="space-y-3 rounded-xl border border-zinc-800 bg-zinc-950 p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-gray-100">
                  Gradient AI → Params JSON
                </h3>
                <span className="text-xs text-gray-400">
                  {aiBusy ? "Working..." : aiStatus || ""}
                </span>
              </div>

              <textarea
                className="w-full rounded border border-zinc-700 bg-zinc-900 p-2 text-sm text-gray-100 placeholder-gray-500"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="Describe your music..."
                rows={3}
                disabled={aiBusy}
              />

              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={handleAiFillParams}
                  disabled={aiBusy || saveBusy || rewardBusy}
                  className={`rounded-lg py-2 text-sm font-bold text-white ${
                    aiBusy || saveBusy || rewardBusy
                      ? "bg-gray-600 cursor-not-allowed"
                      : "bg-purple-600 hover:bg-purple-700"
                  }`}
                >
                  {aiBusy ? "..." : "AI Fill"}
                </button>

                <button
                  onClick={aiThenMidi}
                  disabled={aiBusy || busy !== "" || saveBusy || rewardBusy}
                  className={`rounded-lg py-2 text-sm font-bold text-white ${
                    aiBusy || busy !== "" || saveBusy || rewardBusy
                      ? "bg-gray-600 cursor-not-allowed"
                      : "bg-gray-800 hover:bg-gray-900"
                  }`}
                >
                  AI → MIDI
                </button>

                <button
                  onClick={aiThenMp3}
                  disabled={aiBusy || busy !== "" || saveBusy || rewardBusy}
                  className={`rounded-lg py-2 text-sm font-bold text-white ${
                    aiBusy || busy !== "" || saveBusy || rewardBusy
                      ? "bg-gray-600 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700"
                  }`}
                >
                  AI → MP3
                </button>
              </div>

              <p className="text-xs text-gray-400">
                Calls{" "}
                <code className="rounded bg-zinc-900 px-1">
                  {GRADIENT_BACKEND}/ai/chat
                </code>{" "}
                and expects strict JSON.
              </p>
            </div>

            {/* ✅ REWARD */}
            <div className="space-y-3 rounded-xl border border-zinc-800 bg-zinc-950 p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-gray-100">
                  Reward (Solana Devnet)
                </h3>
                <span className="text-xs text-gray-400">
                  {rewardBusy ? "Sending..." : rewardStatus || ""}
                </span>
              </div>

              {!walletAddress && (
                <div className="rounded border border-yellow-500/30 bg-yellow-500/10 p-3 text-xs text-yellow-200">
                  Wallet not connected. Connect wallet to receive rewards.
                </div>
              )}

              <div className="text-xs text-gray-400">
                Receiver:{" "}
                <span className="text-gray-200 break-all">
                  {walletAddress ?? "(not connected)"}
                </span>
              </div>

              <div className="text-xs text-gray-400">
                Idempotency key:{" "}
                <span className="text-gray-200 break-all">{rewardKey()}</span>
              </div>

              <button
                onClick={handleReward}
                disabled={!walletAddress || rewardBusy || saveBusy || aiBusy || busy !== ""}
                className={`w-full rounded-lg py-2 text-sm font-bold text-white ${
                  !walletAddress || rewardBusy || saveBusy || aiBusy || busy !== ""
                    ? "bg-gray-600 cursor-not-allowed"
                    : "bg-indigo-600 hover:bg-indigo-700"
                }`}
              >
                {rewardBusy ? "Sending..." : "Reward 0.01 SOL"}
              </button>

              {rewardResp && (rewardResp as any).ok && (
                <div className="rounded border border-zinc-800 bg-zinc-900 p-3 text-xs text-gray-200 space-y-1">
                  <div>
                    Status:{" "}
                    <span className="font-semibold">
                      {rewardAlready ? "Already paid (idempotent)" : "Paid"}
                    </span>
                  </div>
                  {rewardSig && (
                    <div>
                      Signature:{" "}
                      <a
                        className="underline"
                        href={`https://explorer.solana.com/tx/${rewardSig}?cluster=devnet`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {rewardSig.slice(0, 12)}…{rewardSig.slice(-12)}
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* SAVE TO SNOWFLAKE */}
            <div className="space-y-3 rounded-xl border border-zinc-800 bg-zinc-950 p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-gray-100">
                  Save metadata to Snowflake
                </h3>
                <span className="text-xs text-gray-400">
                  {saveBusy ? "Saving..." : saveStatus || ""}
                </span>
              </div>

              {!walletAddress && (
                <div className="rounded border border-yellow-500/30 bg-yellow-500/10 p-3 text-xs text-yellow-200">
                  Wallet not connected. Connect wallet to save songs under your
                  address.
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-gray-300">Artist</label>
                  <input
                    className="w-full rounded border border-zinc-700 bg-zinc-900 p-2 text-sm text-gray-100"
                    value={artist}
                    onChange={(e) => setArtist(e.target.value)}
                    placeholder="Han"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-gray-300">
                    Cover URL (optional)
                  </label>
                  <input
                    className="w-full rounded border border-zinc-700 bg-zinc-900 p-2 text-sm text-gray-100"
                    value={coverUrl}
                    onChange={(e) => setCoverUrl(e.target.value)}
                    placeholder="https://.../cover.png"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-gray-300">
                  Audio URL (optional, public https)
                </label>
                <input
                  className="w-full rounded border border-zinc-700 bg-zinc-900 p-2 text-sm text-gray-100"
                  value={publicAudioUrl}
                  onChange={(e) => setPublicAudioUrl(e.target.value)}
                  placeholder="https://.../song.mp3"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-gray-300">
                    MIDI URL (optional)
                  </label>
                  <input
                    className="w-full rounded border border-zinc-700 bg-zinc-900 p-2 text-sm text-gray-100"
                    value={midiPublicUrl}
                    onChange={(e) => setMidiPublicUrl(e.target.value)}
                    placeholder="https://.../song.mid"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-gray-300">
                    Video URL (optional)
                  </label>
                  <input
                    className="w-full rounded border border-zinc-700 bg-zinc-900 p-2 text-sm text-gray-100"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    placeholder="https://.../video.mp4"
                  />
                </div>
              </div>

              <button
                onClick={handleSaveToSnowflake}
                disabled={saveBusy || aiBusy || rewardBusy || busy !== "" || !walletAddress}
                className={`w-full rounded-lg py-2 text-sm font-bold text-white ${
                  saveBusy || aiBusy || rewardBusy || busy !== "" || !walletAddress
                    ? "bg-gray-600 cursor-not-allowed"
                    : "bg-emerald-600 hover:bg-emerald-700"
                }`}
              >
                Save to Snowflake
              </button>

              {savedRowId && (
                <div className="rounded border border-zinc-800 bg-zinc-900 p-3">
                  <div className="text-xs text-gray-400">Saved Row ID</div>
                  <div className="break-all text-sm text-gray-100">
                    {savedRowId}
                  </div>
                </div>
              )}

              <p className="text-[11px] text-gray-500">
                Calls{" "}
                <code className="rounded bg-zinc-900 px-1">
                  {GRADIENT_BACKEND}/snowflake/song-metadata
                </code>
                . It includes{" "}
                <code className="rounded bg-zinc-900 px-1">solana_wallet</code>{" "}
                from your connected wallet.
              </p>
            </div>

            {/* PARAMETERS */}
            <h2 className="text-xl font-bold">Parameters</h2>

            <div className="space-y-2">
              <label className="text-sm font-medium">Song name</label>
              <input
                className="w-full rounded border border-zinc-700 bg-zinc-900 p-2 text-gray-100 placeholder-gray-500"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Vibe</label>
                <select
                  className="w-full rounded border border-zinc-700 bg-zinc-900 p-2 text-gray-100"
                  value={vibe}
                  onChange={(e) => setVibe(e.target.value as Vibe)}
                >
                  {VIBES.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Key</label>
                <select
                  className="w-full rounded border border-zinc-700 bg-zinc-900 p-2 text-gray-100"
                  value={key}
                  onChange={(e) => setKey(e.target.value as KeyName)}
                >
                  {KEYS.map((k) => (
                    <option key={k} value={k}>
                      {k}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Mode</label>
                <select
                  className="w-full rounded border border-zinc-700 bg-zinc-900 p-2 text-gray-100"
                  value={mode}
                  onChange={(e) => setMode(e.target.value as Mode)}
                >
                  {MODES.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
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
                  className="w-full rounded border border-zinc-700 bg-zinc-900 p-2 text-gray-100"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Energy: {energy.toFixed(2)}
                </label>
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
                  onChange={(e) =>
                    setSeed(
                      e.target.value === ""
                        ? ""
                        : clampInt(e.target.value, 0, 1_000_000)
                    )
                  }
                  className="w-full rounded border border-zinc-700 bg-zinc-900 p-2 text-gray-100"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <button
                onClick={handleMidi}
                disabled={!canRun || rewardBusy}
                className={`w-full rounded-lg py-3 font-bold text-white transition ${
                  canRun && !rewardBusy
                    ? "bg-gray-800 hover:bg-gray-900"
                    : "bg-gray-600 cursor-not-allowed"
                }`}
              >
                {busy === "midi" ? "Generating..." : "Generate MIDI"}
              </button>

              <button
                onClick={handleMp3}
                disabled={!canRun || rewardBusy}
                className={`w-full rounded-lg py-3 font-bold text-white transition ${
                  canRun && !rewardBusy
                    ? "bg-blue-600 hover:bg-blue-700"
                    : "bg-gray-600 cursor-not-allowed"
                }`}
              >
                {busy === "mp3" ? "Rendering..." : "Generate MP3"}
              </button>
            </div>

            <p className="text-center text-sm text-gray-400">{status}</p>
          </div>

          {/* RIGHT */}
          <div className="flex flex-col items-center justify-center space-y-6 rounded-xl border border-dashed border-zinc-800 bg-zinc-900 p-6">
            {audioUrl ? (
              <div className="w-full space-y-4">
                <h3 className="text-lg font-semibold text-center">Preview</h3>
                <audio src={audioUrl} controls className="w-full" />
                <p className="text-xs text-gray-400 text-center">
                  Browser preview should work. If it fails, download and play in
                  a real player.
                </p>
              </div>
            ) : (
              <div className="text-center text-gray-400">
                <p>No MP3 yet.</p>
                <p className="text-xs">Click “Generate MP3” or “AI → MP3”.</p>
              </div>
            )}
          </div>
        </div>

        <p className="mt-6 text-xs text-gray-400">
          Env:
          <code className="rounded bg-zinc-900 px-1 ml-2">
            NEXT_PUBLIC_VIBE_API_BASE
          </code>{" "}
          (music API),
          <code className="rounded bg-zinc-900 px-1 ml-2">
            NEXT_PUBLIC_GRADIENT_API_BASE
          </code>{" "}
          (AI/Snowflake API),
          <code className="rounded bg-zinc-900 px-1 ml-2">
            NEXT_PUBLIC_REWARD_API_BASE
          </code>{" "}
          (Solana reward API)
        </p>
      </main>
    </div>
  );
}
