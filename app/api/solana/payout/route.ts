import { NextResponse } from "next/server";
import bs58 from "bs58";
import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  LAMPORTS_PER_SOL,
  sendAndConfirmTransaction,
} from "@solana/web3.js";

export async function POST(req: Request) {
  try {
    const { recipient } = await req.json();

    if (!recipient) {
      return NextResponse.json({ error: "Missing recipient" }, { status: 400 });
    }

    const rpcUrl = process.env.SOLANA_RPC_URL || "https://api.devnet.solana.com";
    const payoutSol = parseFloat(process.env.PAYOUT_SOL || "0.01");
    const secret = process.env.SOLANA_PRIVATE_KEY_BASE58;

    if (!secret) {
      return NextResponse.json({ error: "Missing SOLANA_PRIVATE_KEY_BASE58" }, { status: 500 });
    }

    const connection = new Connection(rpcUrl, "confirmed");

    // Base58 decode secret key -> Keypair
    const secretKey = bs58.decode(secret);
    const sender = Keypair.fromSecretKey(secretKey);

    const toPubkey = new PublicKey(recipient);

    const tx = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: sender.publicKey,
        toPubkey,
        lamports: Math.round(payoutSol * LAMPORTS_PER_SOL),
      })
    );

    const sig = await sendAndConfirmTransaction(connection, tx, [sender], {
      commitment: "confirmed",
    });

    return NextResponse.json({ ok: true, signature: sig, from: sender.publicKey.toBase58() });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || String(e) },
      { status: 500 }
    );
  }
}
