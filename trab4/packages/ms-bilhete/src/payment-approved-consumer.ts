import { getChannel, QUEUES } from "./rabbitmq";
import { generateTicket } from "./generate-ticket";
import crypto from "crypto";

export async function startPaymentApprovedConsumer() {
  const ch = getChannel();

  console.log(`[👂] Waiting for messages in queue: ${QUEUES.PAYMENT_APPROVED}`);

  ch.consume(
    QUEUES.PAYMENT_APPROVED,
    async (msg: any) => {
      if (msg !== null) {
        try {
          console.log(`[📥] Received message from ${QUEUES.PAYMENT_APPROVED}`);

          const content = msg.content.toString();
          const bookingData = JSON.parse(content);
          console.log(`[🔄] Generating ticket for booking: ${bookingData}`);

          const ticket = {
            ...bookingData,
            status: "TICKET_ISSUED",
            ticket: (await hashObject(bookingData)).slice(0, 8),
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

async function hashObject(obj: any) {
  const json = JSON.stringify(obj);
  const encoder = new TextEncoder();
  const data = encoder.encode(json);

  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return hashHex;
}
