import { getChannel, QUEUES } from "./rabbitmq";
import { verifySignature } from "./verify-signature";
import { generateTicket } from "./generate-ticket";

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
          console.log(`[🔄] Generating ticket for booking: ${bookingData}`);

          const ticket = {
            ...bookingData,
            status: "TICKET_ISSUED",
            ticket: signedPayload.signature.slice(0, 8),
          };
          console.log(`[🎫] Ticket generated with ID: ${ticket.id}`);

          await generateTicket(ticket);

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
