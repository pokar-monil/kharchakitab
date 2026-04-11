import type { Expense } from "@/src/utils/schemas";
import type { CurrencyCode } from "@/src/utils/money";
import { ERROR_MESSAGES } from "@/src/utils/error";

export const parseReceiptWithGemini = async (image: Blob, currencyCode: CurrencyCode = "INR"): Promise<Expense> => {
  const fileName = (() => {
    const type = image.type;
    if (type === "image/png") return "receipt.png";
    if (type === "image/webp") return "receipt.webp";
    if (type === "image/heic") return "receipt.heic";
    if (type === "image/heif") return "receipt.heif";
    return "receipt.jpg";
  })();
  const response = await fetch("/api/receipt", {
    method: "POST",
    body: (() => {
      const formData = new FormData();
      formData.append("image", image, fileName);
      formData.append("currency", currencyCode);
      return formData;
    })(),
  });

  if (!response.ok) {
    throw new Error(ERROR_MESSAGES.receiptParsingFailed);
  }

  const data = (await response.json()) as { data?: Expense };

  if (!data.data) {
    throw new Error(ERROR_MESSAGES.failedToParseReceiptJson);
  }

  // Server validates with Zod and returns typed data
  return data.data;
};
