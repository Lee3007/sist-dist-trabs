import { EXCHANGES, getChannel, ROUTING_KEYS } from "@/rabbitmq";
import { Booking } from "./models";

export async function processPayment(booking: Booking) {
  const ch = getChannel();
  await new Promise((resolve) => setTimeout(resolve, 5000));
  const routingKey =
    booking.status === "APPROVED"
      ? ROUTING_KEYS.PAYMENT_APPROVED
      : ROUTING_KEYS.PAYMENT_REJECTED;
  ch.publish(
    EXCHANGES.PAYMENT,
    routingKey,
    Buffer.from(JSON.stringify(booking)),
    { persistent: true }
  );
  const logMessage =
    (booking.status === "APPROVED"
      ? "[✅] Payment approved for: "
      : "[❌] Payment rejected for: ") + booking.id;
  console.log(logMessage);
}
