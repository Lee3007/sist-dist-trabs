import { sendSseUpdate } from "@/app/sse/booking";
import { getChannel, QUEUES } from "@/rabbitmq";
import { bookingRepository } from "@/repositories/booking.repository";

interface SignedPayload {
  message: string;
  signature: string;
}

export async function startPaymentApprovedConsumer() {
  const ch = getChannel();

  console.log(`[👂] Waiting for messages in queue: ${QUEUES.PAYMENT_APPROVED}`);

  ch.consume(
    QUEUES.PAYMENT_APPROVED,
    async (msg) => {
      if (msg !== null) {
        try {
          console.log(`[📥] Received message from ${QUEUES.PAYMENT_APPROVED}`);

          const content = msg.content.toString();
          const bookingData = JSON.parse(content);
          console.log(`[🔄] Updating database booking status: ${bookingData}`);

          const updatedBooking = await bookingRepository.update(
            bookingData.id,
            {
              status: "APPROVED",
            }
          );

          sendSseUpdate(bookingData.id, updatedBooking);

          console.log(`[✅] Booking status updated to APPROVED`);

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
