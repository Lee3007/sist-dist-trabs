import { getChannel } from "@/queue";

export async function rejectPayment(message: string) {
  const ch = getChannel();
  const queue = "pagamento-recusado";
  await ch.assertQueue(queue, { durable: true });
  ch.sendToQueue(queue, Buffer.from(message));
  console.log(`[📤] Enviado para pagamento-recusado: ${message}`);
}
