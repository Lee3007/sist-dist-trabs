import { getChannel, QUEUES } from "@/rabbitmq";
import { verifySignature } from "./verify-signature";
import { bookingRepository } from "@/repositories/booking.repository";

interface SignedPayload {
  message: string;
  signature: string;
}

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
          const signedPayload = JSON.parse(content) as SignedPayload;

          const isSignatureValid = verifySignature(
            signedPayload.message,
            signedPayload.signature
          );

          if (!isSignatureValid) {
            console.error("[❌] Invalid signature - rejecting message");
            ch.nack(msg, false, false);
            return;
          }

          console.log("[✔️] Signature verified successfully");

          const bookingData = JSON.parse(signedPayload.message);
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
