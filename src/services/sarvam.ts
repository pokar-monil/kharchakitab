import { ERROR_MESSAGES } from "@/src/utils/error";

interface TranscribeResult {
  text: string;
  language_code: string | null;
}

export const transcribeAudio = async (blob: Blob): Promise<TranscribeResult> => {
  const formData = new FormData();
  formData.append("file", blob, "audio.webm");

  const response = await fetch("/api/sarvam", {
    method: "POST",
    body: formData,
  });

  if (response.status === 429) {
    const retryAfter = response.headers.get("Retry-After");
    const msg = retryAfter
      ? `Too many requests. Try again in ${retryAfter}s.`
      : "Too many requests. Please wait before trying again.";
    throw new Error(msg);
  }

  if (!response.ok) {
    throw new Error(ERROR_MESSAGES.sarvamTranscriptionFailed);
  }

  const data = (await response.json()) as { text?: string; language_code?: string | null };
  return { text: data.text || "", language_code: data.language_code ?? null };
};
