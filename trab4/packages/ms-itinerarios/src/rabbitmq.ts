import amqp from "amqplib";
import "dotenv/config";

let channel: amqp.Channel;

export const EXCHANGES = {
  BOOKING: "reservas",
};

export const QUEUES = {
  BOOKING_CREATED: "ms-itinerarios:reserva-criada",
  BOOKING_CANCELED: "ms-itinerarios:reserva-cancelada",
};

export const ROUTING_KEYS = {
  BOOKING_CREATED: "created",
  BOOKING_CANCELED: "canceled",
};

export async function initRabbitMQ() {
  const connection = await amqp.connect(
    process.env.RABBITMQ_URL || "amqp://localhost:5672"
  );
  channel = await connection.createChannel();
  console.log("[✔️] Connected to RabbitMQ");

  await channel.assertExchange(EXCHANGES.BOOKING, "direct", { durable: true });

  await channel.assertQueue(QUEUES.BOOKING_CREATED, { durable: true });
  await channel.assertQueue(QUEUES.BOOKING_CANCELED, { durable: true });

  await channel.bindQueue(
    QUEUES.BOOKING_CREATED,
    EXCHANGES.BOOKING,
    ROUTING_KEYS.BOOKING_CREATED
  );

  await channel.bindQueue(
    QUEUES.BOOKING_CANCELED,
    EXCHANGES.BOOKING,
    ROUTING_KEYS.BOOKING_CANCELED
  );

  console.log("[✔️] Exchanges and queues configured");

  return channel;
}

export function getChannel() {
  if (!channel) throw new Error("RabbitMQ not initialized");
  return channel;
}
