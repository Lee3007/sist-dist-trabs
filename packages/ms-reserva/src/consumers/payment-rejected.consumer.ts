import { getChannel, QUEUES } from "@/rabbitmq";
import { verifySignature } from "./verify-signature";
import { bookingRepository } from "@/repositories/booking.repository";

interface SignedPayload {
  message: string;
  signature: string;
}

export async function startPaymentRejectedConsumer() {
  const ch = getChannel();

  console.log(`[👂] Waiting for messages in queue: ${QUEUES.PAYMENT_REJECTED}`);

  ch.consume(
    QUEUES.PAYMENT_REJECTED,
    async (msg) => {
      if (msg !== null) {
        try {
          console.log(`[📥] Received message from ${QUEUES.PAYMENT_REJECTED}`);

          const content = msg.content.toString();

          const bookingData = JSON.parse(content);
          console.log(`[🔄] Updating database booking status: ${bookingData}`);

          bookingRepository.update(bookingData.id, {
            status: "REJECTED",
          });

          console.log(`[✅] Booking status updated to REJECTED`);

          ch.ack(msg);
          console.log("[✔️] Message processed successfully");
        } catch (error) {
          console.error(`[❌] Error processing message: ${error}`);
          ch.nack(msg, false, false);
        }
      }
    },
    { noAck: false }
  );
}
