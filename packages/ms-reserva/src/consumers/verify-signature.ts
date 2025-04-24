import crypto from "crypto";
import fs from "fs";
import path, { dirname } from "path";
import { fileURLToPath } from "url";

export function verifySignature(message: string, signature: string): boolean {
  try {
    const publicKeyPath = path.resolve(
      __dirname,
      "../../../sso/payments_pub.pem"
    );
    const publicKey = fs.readFileSync(publicKeyPath, "utf8");
    if (!publicKey) {
      throw new Error("Public key not initialized");
    }
    const verify = crypto.createVerify("SHA256");
    verify.update(message);
    return verify.verify(publicKey, signature, "base64");
  } catch (error) {
    console.error(`[❌] Error verifying signature: ${error}`);
    return false;
  }
}
