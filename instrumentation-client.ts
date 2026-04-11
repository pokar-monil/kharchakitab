// Defer PostHog initialization to reduce TBT — load async after idle
const enabledFlag = process.env.NEXT_PUBLIC_POSTHOG_ENABLED;
const isEnabled =
  enabledFlag === undefined
    ? process.env.NODE_ENV === "production"
    : enabledFlag === "true";
const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const posthogHost = "/_h";

if (posthogKey && isEnabled) {
  const initPostHog = async () => {
    const { default: posthog } = await import("posthog-js");
    posthog.init(posthogKey, {
      api_host: posthogHost,
      ui_host: "https://us.posthog.com",
      defaults: "2025-11-30",
      capture_exceptions: true,
      disable_session_recording: true,
    });
    // Load the session recorder 15s after init so it doesn't affect TBT.
    setTimeout(() => posthog.startSessionRecording(), 15000);
  };
  // Use requestIdleCallback where available, otherwise setTimeout
  if (typeof requestIdleCallback === "function") {
    requestIdleCallback(() => void initPostHog());
  } else {
    setTimeout(() => void initPostHog(), 3000);
  }
}
