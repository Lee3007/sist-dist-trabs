import { EXCHANGES, getChannel, ROUTING_KEYS } from "@/rabbitmq";
import { createSignedPayload } from "@/sign-message";

export async function processPayment(message: string, approve: boolean = true) {
  const ch = getChannel();
  const payload = await createSignedPayload(message)
  const routingKey = approve ? ROUTING_KEYS.PAYMENT_APPROVED : ROUTING_KEYS.PAYMENT_REJECTED
  ch.publish(EXCHANGES.PAYMENT, routingKey, Buffer.from(JSON.stringify(payload)), { persistent: true });
  const logMessage = (approve ? "[✅] Payment approved for: " : "[❌] Payment rejected for: ") + message
  console.log(logMessage);
}
