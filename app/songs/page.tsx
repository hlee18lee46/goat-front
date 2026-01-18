"use client";

import { useEffect, useMemo, useState } from "react";
import { AppHeader } from "@/components/app-header";
import { useWallet } from "@/components/wallet-context";

type SongItem = {
  id: string;
  name?: string | null;
  artist?: string | null;
  vibe?: string | null;

  bpm?: number | null;
  key?: string | null;
  mode?: string | null;
  bars?: number | null;
  energy?: number | null;
  seed?: number | null;

  audio_url?: string | null;
  midi_url?: string | null;
  video_url?: string | null;
  cover_url?: string | null;

  solana_wallet?: string | null;
  solana_signature?: string | null;

  audio_sha256?: string | null;
  ai_prompt?: string | null;
  created_at?: string | null;
};

type ListResp = {
  ok: boolean;
  items: SongItem[];
  limit: number;
  offset: number;
  detail?: string;
};

function pill(text: string) {
  return (
    <span className="px-2 py-1 rounded-md text-xs bg-white/5 border border-white/10 text-muted-foreground">
      {text}
    </span>
  );
}

export default function SongsPage() {
  const { walletAddress } = useWallet();

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";

  const [items, setItems] = useState<SongItem[]>([]);
  const [limit, setLimit] = useState(20);
  const [offset, setOffset] = useState(0);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const queryUrl = useMemo(() => {
    if (!walletAddress) return null;
    const url = new URL("/snowflake/song-metadata", API_BASE);
    url.searchParams.set("wallet_address", walletAddress);
    url.searchParams.set("limit", String(limit));
    url.searchParams.set("offset", String(offset));
    return url.toString();
  }, [API_BASE, walletAddress, limit, offset]);

  async function load() {
    if (!queryUrl) {
      setItems([]);
      return;
    }
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch(queryUrl, { cache: "no-store" });
      const data = (await res.json()) as ListResp;

      if (!res.ok || !data.ok) {
        throw new Error(data.detail || `Request failed (${res.status})`);
      }
      setItems(Array.isArray(data.items) ? data.items : []);
    } catch (e: any) {
      setErr(e?.message || "Failed to load songs");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryUrl]);

  const canPrev = offset > 0;
  const canNext = items.length === limit; // best-effort (until backend returns total)

  return (
    <div className="min-h-screen">
      <AppHeader
        title="My Songs"
        subtitle="Your saved creations, pulled from Snowflake using your connected wallet."
      />

      <main className="container mx-auto px-4 pb-16">
        <div className="max-w-4xl mx-auto">
          {!walletAddress ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <p className="text-sm text-muted-foreground">
                Connect your wallet to load your songs.
              </p>
            </div>
          ) : (
            <>
              {/* Controls */}
              <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between mb-6">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  {pill(`limit: ${limit}`)}
                  {pill(`offset: ${offset}`)}
                  {loading ? pill("loading...") : pill(`${items.length} items`)}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={load}
                    disabled={loading}
                    className="px-3 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition text-sm disabled:opacity-50"
                  >
                    Refresh
                  </button>

                  <select
                    value={limit}
                    disabled={loading}
                    onChange={(e) => {
                      setOffset(0);
                      setLimit(parseInt(e.target.value, 10));
                    }}
                    className="px-3 py-2 rounded-xl border border-white/10 bg-black/20 text-sm"
                  >
                    {[10, 20, 50, 100].map((n) => (
                      <option key={n} value={n}>
                        {n} / page
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Error */}
              {err && (
                <div className="mb-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm">
                  <span className="font-semibold text-red-200">Error:</span>{" "}
                  <span className="text-red-100/90">{err}</span>
                </div>
              )}

              {/* List */}
              {items.length === 0 && !loading ? (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                  <p className="text-sm text-muted-foreground">
                    No songs found for this wallet yet.
                  </p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {items.map((s) => (
                    <div
                      key={s.id}
                      className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden"
                    >
                      {s.cover_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={s.cover_url}
                          alt={s.name || "Cover"}
                          className="w-full h-44 object-cover"
                        />
                      ) : (
                        <div className="w-full h-16 bg-black/30" />
                      )}

                      <div className="p-5">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                          <div className="min-w-0">
                            <h3 className="text-lg font-semibold text-foreground truncate">
                              {s.name || "Untitled"}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {s.artist || "Unknown artist"}
                              {s.vibe ? <> • {s.vibe}</> : null}
                            </p>
                          </div>

                          <div className="text-xs text-muted-foreground sm:text-right">
                            {s.created_at ? <div>{s.created_at}</div> : null}
                            {s.solana_signature ? (
                              <div className="mt-1 font-mono">
                                sig {s.solana_signature.slice(0, 4)}…{s.solana_signature.slice(-4)}
                              </div>
                            ) : null}
                          </div>
                        </div>

                        {/* Metadata pills */}
                        <div className="flex flex-wrap gap-2 mt-3">
                          {typeof s.bpm === "number" && pill(`BPM ${s.bpm}`)}
                          {s.key && pill(`Key ${s.key}`)}
                          {s.mode && pill(s.mode)}
                          {typeof s.bars === "number" && pill(`${s.bars} bars`)}
                          {typeof s.energy === "number" && pill(`Energy ${s.energy}`)}
                        </div>

                        {/* Prompt */}
                        {s.ai_prompt ? (
                          <div className="mt-4">
                            <div className="text-xs font-semibold text-foreground/90 mb-1">
                              Prompt
                            </div>
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                              {s.ai_prompt}
                            </p>
                          </div>
                        ) : null}

                        {/* Links */}
                        <div className="mt-4 flex flex-col gap-3">
                          {s.audio_url ? (
                            <audio controls className="w-full">
                              <source src={s.audio_url} />
                            </audio>
                          ) : null}

                          <div className="flex flex-wrap gap-2">
                            {s.audio_url ? (
                              <a
                                href={s.audio_url}
                                target="_blank"
                                rel="noreferrer"
                                className="px-3 py-2 rounded-xl border border-white/10 bg-black/20 hover:bg-black/30 transition text-sm"
                              >
                                Open Audio
                              </a>
                            ) : null}

                            {s.midi_url ? (
                              <a
                                href={s.midi_url}
                                target="_blank"
                                rel="noreferrer"
                                className="px-3 py-2 rounded-xl border border-white/10 bg-black/20 hover:bg-black/30 transition text-sm"
                              >
                                Open MIDI
                              </a>
                            ) : null}

                            {s.video_url ? (
                              <a
                                href={s.video_url}
                                target="_blank"
                                rel="noreferrer"
                                className="px-3 py-2 rounded-xl border border-white/10 bg-black/20 hover:bg-black/30 transition text-sm"
                              >
                                Open Video
                              </a>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Pagination */}
              <div className="flex items-center justify-between mt-8">
                <button
                  disabled={!canPrev || loading}
                  onClick={() => setOffset((o) => Math.max(0, o - limit))}
                  className="px-3 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition text-sm disabled:opacity-50"
                >
                  Prev
                </button>

                <button
                  disabled={!canNext || loading}
                  onClick={() => setOffset((o) => o + limit)}
                  className="px-3 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition text-sm disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
