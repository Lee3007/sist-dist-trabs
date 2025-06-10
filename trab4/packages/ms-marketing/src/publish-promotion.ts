import { EXCHANGES, getChannel } from "./rabbitmq";

export async function publishPromotion(
  destination: string,
  title: string,
  discount: number
) {
  const channel = getChannel();
  channel.publish(
    EXCHANGES.PROMOTIONS,
    destination,
    Buffer.from(
      JSON.stringify({ destination, title, discount: discount + "%" })
    ),
    { persistent: true }
  );

  console.log(`[💸] Published promotion for ${destination}: "${title}"`);
}
