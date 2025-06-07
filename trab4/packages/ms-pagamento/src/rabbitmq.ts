import amqp from "amqplib";

let channel: amqp.Channel;

export const EXCHANGES = {
  BOOKING: "reservas",
  PAYMENT: "pagamentos",
};

export const QUEUES = {
  BOOKING_CREATED: "reserva-criada",
  PAYMENT_APPROVED: "ms-pagamento:pagamento-aprovado",
  PAYMENT_REJECTED: "pagamento-recusado",
};

export const ROUTING_KEYS = {
  PAYMENT_APPROVED: "approved",
  PAYMENT_REJECTED: "rejected",
};

export async function initRabbitMQ() {
  const connection = await amqp.connect(
    process.env.RABBITMQ_URL || "amqp://localhost:5672"
  );
  channel = await connection.createChannel();
  console.log("[✔️] Connected to RabbitMQ");

  await channel.assertExchange(EXCHANGES.BOOKING, "fanout", { durable: true });
  await channel.assertExchange(EXCHANGES.PAYMENT, "direct", { durable: true });

  await channel.assertQueue(QUEUES.BOOKING_CREATED, { durable: true });
  await channel.assertQueue(QUEUES.PAYMENT_APPROVED, { durable: true });
  await channel.assertQueue(QUEUES.PAYMENT_REJECTED, { durable: true });

  await channel.bindQueue(QUEUES.BOOKING_CREATED, EXCHANGES.BOOKING, "");

  await channel.bindQueue(
    QUEUES.PAYMENT_APPROVED,
    EXCHANGES.PAYMENT,
    ROUTING_KEYS.PAYMENT_APPROVED
  );

  await channel.bindQueue(
    QUEUES.PAYMENT_REJECTED,
    EXCHANGES.PAYMENT,
    ROUTING_KEYS.PAYMENT_REJECTED
  );

  console.log("[✔️] Exchanges and queues configured");

  return channel;
}

export function getChannel() {
  if (!channel) throw new Error("RabbitMQ not initialized");
  return channel;
}
