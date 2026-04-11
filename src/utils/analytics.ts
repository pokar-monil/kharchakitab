// Lightweight PostHog wrapper — queues events until the library loads.
// This avoids importing the full posthog-js module synchronously.

type QueuedEvent = { event: string; properties?: Record<string, unknown> };

let _posthog: typeof import("posthog-js").default | null = null;
const _queue: QueuedEvent[] = [];
let _loading = false;

async function ensurePostHog() {
  if (_posthog) return _posthog;
  if (_loading) return null;
  _loading = true;
  try {
    const mod = await import("posthog-js");
    _posthog = mod.default;
    // Flush queued events
    for (const { event, properties } of _queue) {
      _posthog.capture(event, properties);
    }
    _queue.length = 0;
    return _posthog;
  } catch {
    _loading = false;
    return null;
  }
}

export function capture(event: string, properties?: Record<string, unknown>) {
  if (_posthog) {
    _posthog.capture(event, properties);
  } else {
    _queue.push({ event, properties });
    void ensurePostHog();
  }
}
