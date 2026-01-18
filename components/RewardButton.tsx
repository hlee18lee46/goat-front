"use client";

import { useState } from "react";

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

function stringifyErr(d: any) {
  if (!d) return "Unknown error";
  if (typeof d === "string") return d;
  if (d.error) return String(d.error);
  if (d.detail) return stringifyErr(d.detail);
  try {
    return JSON.stringify(d);
  } catch {
    return String(d);
  }
}

export function RewardButton(props: {
  receiverWallet: string;      // user wallet to receive reward
  idempotencyKey: string;      // e.g. `song_${songId}`
  amountSol?: number;          // default 0.01
  backendBase?: string;        // default from env
}) {
  const {
    receiverWallet,
    idempotencyKey,
    amountSol = 0.01,
    backendBase = process.env.NEXT_PUBLIC_REWARD_API_BASE ?? "https://sol-render.onrender.com",
  } = props;

  const [loading, setLoading] = useState(false);
  const [resp, setResp] = useState<RewardResponse | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function sendReward() {
    setLoading(true);
    setErr(null);
    setResp(null);

    try {
      const r = await fetch(`${backendBase}/reward/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // IMPORTANT: keep idempotency key stable per song/save action
        body: JSON.stringify({
          receiver_wallet_address: receiverWallet,
          amount_sol: amountSol,
          idempotency_key: idempotencyKey,
        }),
      });

      const ct = r.headers.get("content-type") || "";
      const data = ct.includes("application/json") ? await r.json() : { error: await r.text() };

      if (!r.ok) {
        throw new Error(stringifyErr(data));
      }

      setResp(data);
    } catch (e: any) {
      setErr(e?.message ?? String(e));
    } finally {
      setLoading(false);
    }
  }

  const sig = (resp as any)?.signature as string | undefined;
  const already = (resp as any)?.already_paid as boolean | undefined;

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={sendReward}
        disabled={loading || !receiverWallet || !idempotencyKey}
        className="rounded-xl px-4 py-2 font-semibold border hover:opacity-90 disabled:opacity-50"
      >
        {loading ? "Sending reward..." : `Reward ${amountSol} SOL`}
      </button>

      {err && (
        <div className="text-sm">
          <span className="font-semibold">Error:</span> {err}
        </div>
      )}

      {resp && (resp as any).ok && (
        <div className="text-sm flex flex-col gap-1">
          <div>
            Status:{" "}
            <span className="font-semibold">
              {already ? "Already paid (idempotent)" : "Paid"}
            </span>
          </div>

          {sig && (
            <div>
              Signature:{" "}
              <a
                className="underline"
                href={`https://explorer.solana.com/tx/${sig}?cluster=devnet`}
                target="_blank"
                rel="noreferrer"
              >
                {sig.slice(0, 12)}…{sig.slice(-12)}
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
