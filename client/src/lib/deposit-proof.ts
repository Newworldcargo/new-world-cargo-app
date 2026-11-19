import type { SupplierPaymentMethod } from "@/lib/supplier-payment-draft";

const receiptMimeTypes = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
const receiptExtensions = /\.(pdf|jpe?g|png|webp)$/i;
export const depositProofMaxBytes = 3 * 1024 * 1024;
export const depositProofAccept = [...receiptMimeTypes, ".pdf", ".jpg", ".jpeg", ".png", ".webp"].join(",");

export function acceptsDepositProof(method?: SupplierPaymentMethod | null) {
  return method === "atm_deposit" || method === "office_cash";
}

export function depositProofFileError(file: File) {
  if (!file.size || file.size > depositProofMaxBytes) return "Choose a receipt up to 3 MB.";
  if (file.type ? !receiptMimeTypes.includes(file.type) : !receiptExtensions.test(file.name)) {
    return "Choose a PDF, JPG, PNG or WebP receipt.";
  }
  return "";
}

export function encodeDepositProof(file: File) {
  return new Promise<{ name: string; data: string }>((resolve, reject) => {
    const reader = new FileReader();
    const onReadFailure = () => reject(new Error("We couldn’t read this receipt. Choose it again and retry."));
    reader.onerror = onReadFailure;
    reader.onabort = onReadFailure;
    reader.onload = () => {
      const data = typeof reader.result === "string" ? reader.result.split(",", 2)[1] : null;
      if (data) resolve({ name: file.name, data });
      else onReadFailure();
    };
    reader.readAsDataURL(file);
  });
}
