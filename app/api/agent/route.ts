import { generateText, streamText, stepCountIs } from 'ai'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { createAgentTools } from '@/src/lib/agent/tools'
import type { DataSnapshot, PendingWriteAction } from '@/src/lib/agent/types'

const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY,
})

const GEMINI_MODELS = process.env.GEMINI_MODEL!
  .split(",")
  .map((m) => m.trim())
  .filter(Boolean);

// Use first model; strip "models/" prefix for AI SDK compatibility
const MODEL_ID = GEMINI_MODELS[0].replace(/^models\//, "");

const SYSTEM_PROMPT = `You are Kharchakitab's financial assistant. You help users understand their spending and manage their budget.

Rules:
- You have NO expense data until you call tools. Never answer with numbers you didn't get from a tool response.
- For questions about "on track", "over budget", "how much spent": call get_budget AND get_summary in the same turn
- For "upcoming bills" or "subscriptions": call get_recurring
- For specific transaction or item lookups: call query_expenses
- Budgets are a single monthly total (not per-category). When the user asks "am I on track", compare total spend across all categories against the one monthly budget limit.
- For WRITE actions (set_budget): call the tool immediately once you have the amount. The tool does NOT execute the write — it returns pending_confirmation and the app shows a confirmation card. In your reply, say something like "Please confirm the budget change below 👇" — NEVER say the budget "has been set" or "is done" because it hasn't happened yet.
- Speak in a friendly, direct tone. Use ₹ for amounts. Mix Hinglish naturally.
- Tools cover the current month + last 3 months. If user asks about older data, say it's outside the available window.`

export async function POST(request: Request) {
  console.time('agent:total-roundtrip')

  try {
    const { messages, snapshot, stream: wantStream }: {
      messages: any[]
      snapshot: DataSnapshot
      stream?: boolean
    } = await request.json()

    const tools = createAgentTools(snapshot)

    // ── Streaming path ──
    if (wantStream) {
      const result = streamText({
        model: google(MODEL_ID),
        system: SYSTEM_PROMPT,
        messages,
        tools,
        stopWhen: stepCountIs(5),
        temperature: 0,
      })

      const encoder = new TextEncoder()

      const stream = new ReadableStream({
        async start(controller) {
          const send = (data: Record<string, unknown>) => {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
          }

          try {
            const streamResult = await result

            // Stream text chunks
            for await (const chunk of streamResult.textStream) {
              send({ type: 'text', content: chunk })
            }

            // After streaming is done, check for pending actions and send response messages
            let pendingAction: PendingWriteAction | null = null
            const steps = await streamResult.steps
            for (const step of steps) {
              for (const tr of step.toolResults) {
                const output = tr.output as Record<string, unknown> | undefined
                if (output && output.status === 'pending_confirmation') {
                  pendingAction = {
                    tool: 'set_budget',
                    params: { monthly_limit_inr: output.monthly_limit_inr as number },
                  }
                }
              }
            }

            const response = await streamResult.response
            send({ type: 'response_messages', messages: response.messages })
            if (pendingAction) {
              send({ type: 'pending_action', action: pendingAction })
            }
            send({ type: 'done' })
          } catch (err) {
            send({ type: 'error', message: err instanceof Error ? err.message : 'Stream error' })
          } finally {
            controller.close()
            console.timeEnd('agent:total-roundtrip')
          }
        },
      })

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        },
      })
    }

    // ── Non-streaming path (backward compat) ──
    const result = await generateText({
      model: google(MODEL_ID),
      system: SYSTEM_PROMPT,
      messages,
      tools,
      stopWhen: stepCountIs(5),
      temperature: 0,
    })

    let pendingAction: PendingWriteAction | null = null
    for (const step of result.steps) {
      for (const tr of step.toolResults) {
        const output = tr.output as Record<string, unknown> | undefined
        if (output && output.status === 'pending_confirmation') {
          pendingAction = {
            tool: 'set_budget',
            params: { monthly_limit_inr: output.monthly_limit_inr as number },
          }
        }
      }
    }

    console.log('agent:steps', result.steps.length, 'tools-called:', result.steps.flatMap(s => s.toolCalls.map(tc => tc.toolName)))
    console.timeEnd('agent:total-roundtrip')

    return Response.json({
      reply: result.text,
      responseMessages: result.response.messages,
      pendingAction,
    })
  } catch (error) {
    console.error('agent:error', error)
    console.timeEnd('agent:total-roundtrip')
    return Response.json(
      {
        reply: 'Something went wrong, try again.',
        responseMessages: [],
        pendingAction: null,
      },
      { status: 200 }
    )
  }
}
