import { sendSseUpdate } from "@/app/sse/marketing";
import { getChannel, QUEUES } from "@/rabbitmq";

export async function startPromotionConsumer() {
  const ch = getChannel();

  console.log(
    `[👂] Waiting for messages in queue: ${QUEUES.PROMOTION_GENERATED}`
  );

  ch.consume(
    QUEUES.PROMOTION_GENERATED,
    async (msg) => {
      if (msg !== null) {
        try {
          console.log(
            `[📥] Received message from ${QUEUES.PROMOTION_GENERATED}`
          );

          const content = msg.content.toString();
          const promotionData = JSON.parse(content);

          console.log(`[🔄] Sending promotion data:`, promotionData);

          sendSseUpdate(promotionData.destination, promotionData);

          console.log(`[✅] Promotion data sent successfully`);

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
