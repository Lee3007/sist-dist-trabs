import crypto from 'crypto';
import fs from 'fs';

export async function verifySignature(message: string, signature: string): Promise<boolean> {
  try {
    const publicKey = fs.readFileSync("../../sso/payments_pub.pem", 'utf8');
    const verify = crypto.createVerify('SHA256');
    verify.update(message);
    return verify.verify(publicKey, signature, 'base64');
  } catch (error) {
    console.error(`[❌] Error verifying signature: ${error}`);
    return false;
  }
}