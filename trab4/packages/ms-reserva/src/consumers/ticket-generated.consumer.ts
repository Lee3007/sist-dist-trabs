import { getChannel, QUEUES } from "@/rabbitmq";
import { bookingRepository } from "@/repositories/booking.repository";

export async function startTicketGeneratedConsumer() {
  const ch = getChannel();

  console.log(`[👂] Waiting for messages in queue: ${QUEUES.TICKET_GENERATED}`);

  ch.consume(
    QUEUES.TICKET_GENERATED,
    async (msg) => {
      if (msg !== null) {
        try {
          console.log(`[📥] Received message from ${QUEUES.TICKET_GENERATED}`);

          const content = msg.content.toString();
          const bookingData = JSON.parse(content);

          console.log(`[🔄] Updating database booking status:`, bookingData);

          await bookingRepository.update(bookingData.id, {
            status: "TICKET_ISSUED",
          });

          console.log(`[✅] Booking status updated to TICKET_ISSUED`);

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
