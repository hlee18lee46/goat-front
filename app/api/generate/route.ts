import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // 1. Map the Frontend "Vibe" UI to your Backend MIDI Params
    const midiParams = {
      bpm: body.tempo,
      key: body.key.split(" ")[0], // Extract "C" from "C minor"
      mode: body.key.toLowerCase().includes("minor") ? "minor" : "major",
      seed: body.seed || 42,
      energy: body.mood === "upbeat" ? 0.9 : 0.5,
      bars: 8, // Fixed for now
      progression: body.genre === "synthwave" ? "i-VI-VII-i" : "I-V-vi-IV",
    };

    // 2. Call your FastAPI server for the MP3
    const response = await fetch("http://127.0.0.1:8010/v1/song/mp3", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "vibe_song",
        params: midiParams,
      }),
    });

    if (!response.ok) throw new Error("FastAPI failed to generate audio");

    // 3. Convert binary response to Base64 to send to the Frontend
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Audio = buffer.toString("base64");

    return NextResponse.json({
      ok: true,
      audio_base64: base64Audio,
      mime_type: "audio/mpeg",
    });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}