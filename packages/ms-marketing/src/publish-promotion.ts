import { getChannel } from './rabbitmq';

interface PromotionMessage {
  id: string;
  destination: string;
  title: string;
  description: string;
  discountPercentage: number;
  startDate: string;
  endDate: string;
  createdAt: string;
}

export async function publishPromotion(destination: string) {
  const channel = getChannel();
  const title = "Summer Sale!"
  const exchange = `promocoes-${destination}`;
  await channel.assertExchange(exchange, "fanout", { durable: false });
  channel.publish(
    exchange,
    "",
    Buffer.from(JSON.stringify({destination, title})),
    { persistent: true }
  );
  
  console.log(`[📤] Published promotion for ${destination}: "${title}"`);
}