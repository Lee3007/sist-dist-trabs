import { EXCHANGES, getChannel } from "./rabbitmq";


export async function startAllConsumers(email: string, destinations: string[]) {
    destinations.forEach(async (destination) => {
        await subscribeUserToItinerary(email, destination)
    })
}

async function subscribeUserToItinerary(email: string, destination: string) {
    const channel = getChannel()
    const { queue } = await channel.assertQueue(`promos_${email}_${destination}`, { exclusive: true });
    await channel.bindQueue(queue, EXCHANGES.PROMOTIONS, destination);
    channel.consume(queue, (msg) => {
      if (msg !== null)
        console.log(`[🤑] Promotion received on email ${email} for destination ${destination}`)
    });
}