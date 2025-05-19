import { getChannel, QUEUES } from "./rabbitmq";

export async function startBookingsConsumer(
  callback: (bookingData: string) => Promise<void>
) {
  const ch = getChannel();

  console.log(`[👂] Waiting for messages in queue: ${QUEUES.BOOKING_CREATED}`);

  ch.consume(
    QUEUES.BOOKING_CREATED,
    (msg) => {
      if (msg !== null) {
        const content = msg.content.toString();
        console.log(`[📥] Received from ${QUEUES.BOOKING_CREATED}: ${content}`);
        
        callback(content)
          .then(() => {
            ch.ack(msg);
            console.log(`[✔️] Message processed successfully`);
          })
          .catch((error) => {
            console.error(`[❌] Error processing message: ${error.message}`);
            ch.nack(msg, false, false);
          });
      }
    },
    { noAck: false }
  );
}