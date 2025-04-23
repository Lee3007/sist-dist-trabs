import amqp from 'amqplib';

let connection: amqp.ChannelModel
let channel: amqp.Channel;

export const EXCHANGES = {
    PROMOTIONS: "promocoes"
};


export async function initRabbitMQ() {
  connection = await amqp.connect(
    process.env.RABBITMQ_URL || "amqp://localhost:5672"
  );
  channel = await connection.createChannel();

  await channel.assertExchange(EXCHANGES.PROMOTIONS, "direct", { durable: false });
  
  return channel;
}

export function getChannel() {
  if (!channel) throw new Error('RabbitMQ not initialized');
  return channel;
}

export function getConnection() {
  if (!connection) throw new Error('RabbitMQ not initialized');
  return connection;
}