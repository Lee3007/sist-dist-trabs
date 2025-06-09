import { getChannel, EXCHANGES } from "./rabbitmq";

export async function generateTicket(ticket: any) {
  const ch = getChannel();
  await new Promise((resolve) => setTimeout(resolve, 2000));
  ch.publish(EXCHANGES.TICKET, "", Buffer.from(JSON.stringify(ticket)), {
    persistent: true,
  });

  console.log(
    `[📤] Published ticket generated event for ticket ID: ${ticket.id}`
  );
}
