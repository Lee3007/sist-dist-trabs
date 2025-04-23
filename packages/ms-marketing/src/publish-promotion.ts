import { EXCHANGES, getChannel } from './rabbitmq';

export async function publishPromotion(destination: string) {
  const channel = getChannel();
  const title = "Summer Sale!"
  channel.publish(
    EXCHANGES.PROMOTIONS,
    destination,
    Buffer.from(JSON.stringify({destination, title})),
    { persistent: true }
  );
  
  console.log(`[💸] Published promotion for ${destination}: "${title}"`);
}