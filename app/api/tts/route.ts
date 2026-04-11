import { NextRequest } from "next/server"
import { rateLimitByIp } from "@/src/lib/ratelimit"

const SARVAM_TTS_ENDPOINT = "https://api.sarvam.ai/text-to-speech/stream"

export async function POST(request: NextRequest) {
  const limit = await rateLimitByIp(request, {
    prefix: "tts",
    max: 20,
    window: "60 s",
  })
  if (!limit.allowed) {
    return new Response(
      JSON.stringify({ error: limit.reason ?? "Too many requests." }),
      {
        status: limit.skipped ? 500 : 429,
        headers: {
          "Content-Type": "application/json",
          ...(limit.retryAfter ? { "Retry-After": String(limit.retryAfter) } : {}),
        },
      }
    )
  }

  const apiKey = process.env.SARVAM_KEY
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "Missing SARVAM_KEY." }), { status: 500 })
  }

  const body = (await request.json()) as {
    text?: string
    language?: string
    speaker?: string
  }
  const text = body.text?.trim()
  if (!text) {
    return new Response(JSON.stringify({ error: "Missing text." }), { status: 400 })
  }

  const response = await fetch(SARVAM_TTS_ENDPOINT, {
    method: "POST",
    headers: {
      "api-subscription-key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text,
      target_language_code: body.language || "hi-IN",
      speaker: body.speaker || "shubh",
      model: process.env.SARVAM_TTS_MODEL || "bulbul:v3",
      temperature: 0.6,
      pace: 1.0,
      output_audio_codec: "mp3",
      output_audio_bitrate: "128k",
      enable_preprocessing: true,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    return new Response(
      JSON.stringify({
        error: "Sarvam TTS failed.",
        upstreamStatus: response.status,
        upstreamBody: errorText.slice(0, 500),
      }),
      { status: 502 }
    )
  }

  // Stream the audio binary directly back to the client
  return new Response(response.body, {
    headers: {
      "Content-Type": response.headers.get("Content-Type") || "audio/mpeg",
      "Cache-Control": "no-cache",
    },
  })
}
