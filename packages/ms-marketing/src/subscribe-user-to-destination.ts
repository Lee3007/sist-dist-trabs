import { email } from "envalid";
import { getChannel } from "./rabbitmq";

export async function subscribeUserToItinerary(email: string, destination: string) {
    const exchange = `promocoes-${destination}`;
    const channel = getChannel()
    await channel.assertExchange(exchange, "fanout", { durable: false });
    const { queue } = await channel.assertQueue("", { exclusive: true });
    await channel.bindQueue(queue, exchange, "");
    channel.consume(queue, (msg) => {
      if (msg !== null)
        console.log(`[🤑] Promotion received on email ${email} for destination ${destination}`)
    });
}