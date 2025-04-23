import crypto from 'crypto';
import fs from 'fs/promises';


async function signMessage(message: string): Promise<string> {
    const privateKey = await fs.readFile('../../sso/payments.pem', 'utf8');
    if (!privateKey) {
        throw new Error('Private key not initialized');
    }

    const sign = crypto.createSign('SHA256');
    sign.update(message);
    sign.end();

    return sign.sign(privateKey, 'base64');
}

export async function createSignedPayload(message: string): Promise<{ message: string; signature: string; }> {
    const signature = await signMessage(message);
    return {
        message,
        signature
    };
}