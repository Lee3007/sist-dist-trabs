import { getChannel } from "@/queue";

export async function startBookingsConsumer(
  callback: (message: string) => void
) {
  const ch = getChannel();
  const queue = "reserva-criada";
  await ch.assertQueue(queue, { durable: true });

  ch.consume(
    queue,
    (msg) => {
      if (msg !== null) {
        const content = msg.content.toString();
        callback(content);
        ch.ack(msg);
      }
    },
    { noAck: false }
  );
}
