import { EXCHANGES, getChannel, ROUTING_KEYS } from "@/rabbitmq";
import { createSignedPayload } from "@/sign-message";

export async function processPayment(message: string, approve: boolean = true) {
  const ch = getChannel();
  await new Promise((resolve) => setTimeout(resolve, 5000));
  const bookingData = JSON.parse(message);
  bookingData.status = approve ? "APPROVED" : "REJECTED";
  const payload = await createSignedPayload(JSON.stringify(bookingData));
  const routingKey = approve
    ? ROUTING_KEYS.PAYMENT_APPROVED
    : ROUTING_KEYS.PAYMENT_REJECTED;
  ch.publish(
    EXCHANGES.PAYMENT,
    routingKey,
    Buffer.from(JSON.stringify(payload)),
    { persistent: true }
  );
  const logMessage =
    (approve ? "[✅] Payment approved for: " : "[❌] Payment rejected for: ") +
    message;
  console.log(logMessage);
}
