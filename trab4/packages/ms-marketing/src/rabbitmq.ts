import amqp from "amqplib";

let connection: amqp.ChannelModel;
let channel: amqp.Channel;

export const EXCHANGES = {
  PROMOTIONS: "promocoes",
};

export async function initRabbitMQ() {
  connection = await amqp.connect(
    process.env.RABBITMQ_URL || "amqp://localhost:5672"
  );
  channel = await connection.createChannel();

  await channel.assertExchange(EXCHANGES.PROMOTIONS, "fanout", {
    durable: true,
  });

  return channel;
}

export function getChannel() {
  if (!channel) throw new Error("RabbitMQ not initialized");
  return channel;
}
