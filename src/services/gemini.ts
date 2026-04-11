import type { Expense } from "@/src/utils/schemas";
import { getSystemPrompt } from "@/src/utils/prompts";
import type { CurrencyCode } from "@/src/utils/money";
import { ERROR_MESSAGES } from "@/src/utils/error";
import { formatDateYMD } from "@/src/utils/dates";

export const parseWithGeminiFlash = async (text: string, currencyCode: CurrencyCode = "INR"): Promise<Expense[]> => {
  const today = formatDateYMD(new Date());
  const prompt = getSystemPrompt(currencyCode);
  const response = await fetch("/api/gemini", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text: `${prompt}\nToday: ${today}\nInput: ${text}`,
    }),
  });

  const data = (await response.json()) as { data?: unknown; error?: string };

  if (!response.ok) {
    throw new Error(data.error ?? ERROR_MESSAGES.geminiFlashRequestFailed);
  }
  // Server validates with Zod and returns typed data
  return (data.data ?? []) as Expense[];
};
