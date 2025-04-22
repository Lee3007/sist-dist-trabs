import { getChannel } from "@/queue";

export async function approvePayment(message: string) {
  const ch = getChannel();
  const queue = "pagamento-aprovado";
  await ch.assertQueue(queue, { durable: true });
  ch.sendToQueue(queue, Buffer.from(message));
  console.log(`[📤] Enviado para pagamento-aprovado: ${message}`);
}
