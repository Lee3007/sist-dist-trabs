import amqp from "amqplib";

let channel: amqp.Channel;

export const EXCHANGES = {
  BOOKING: "reservas",
  PAYMENT: "pagamentos",
  TICKET: "bilhetes",
};

export const QUEUES = {
  BOOKING_CREATED: "reserva-criada",
  PAYMENT_APPROVED: "ms-reserva:pagamento-aprovado",
  PAYMENT_REJECTED: "ms-reserva:pagamento-recusado",
  TICKET_GENERATED: "bilhete-gerado",
};

export const ROUTING_KEYS = {
  PAYMENT_APPROVED: "approved",
  PAYMENT_REJECTED: "rejected",
  TICKET_GENERATED: "generated",
};

export async function initRabbitMQ() {
  const connection = await amqp.connect(
    process.env.RABBITMQ_URL || "amqp://localhost:5672"
  );
  channel = await connection.createChannel();
  console.log("[✔️] Connected to RabbitMQ");

  await channel.assertExchange(EXCHANGES.BOOKING, "fanout", { durable: true });
  await channel.assertExchange(EXCHANGES.PAYMENT, "direct", { durable: true });
  await channel.assertExchange(EXCHANGES.TICKET, "fanout", { durable: true });

  await channel.assertQueue(QUEUES.BOOKING_CREATED, { durable: true });
  await channel.assertQueue(QUEUES.PAYMENT_APPROVED, { durable: true });
  await channel.assertQueue(QUEUES.PAYMENT_REJECTED, { durable: true });
  await channel.assertQueue(QUEUES.TICKET_GENERATED, { durable: true });

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

  await channel.bindQueue(QUEUES.TICKET_GENERATED, EXCHANGES.TICKET, "");

  console.log("[✔️] Exchanges and queues configured");

  return channel;
}

export function getChannel() {
  if (!channel) throw new Error("RabbitMQ not initialized");
  return channel;
}
