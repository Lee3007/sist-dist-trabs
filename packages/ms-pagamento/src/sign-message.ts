import crypto from "crypto";
import fs from "fs/promises";
import path, { dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function signMessage(message: string): Promise<string> {
  const privateKeyPath = path.resolve(__dirname, "../../sso/payments.pem");
  const privateKey = await fs.readFile(privateKeyPath, "utf8");
  if (!privateKey) {
    throw new Error("Private key not initialized");
  }

  const sign = crypto.createSign("SHA256");
  sign.update(message);
  sign.end();

  return sign.sign(privateKey, "base64");
}

export async function createSignedPayload(
  message: string
): Promise<{ message: string; signature: string }> {
  const signature = await signMessage(message);
  return {
    message,
    signature,
  };
}
