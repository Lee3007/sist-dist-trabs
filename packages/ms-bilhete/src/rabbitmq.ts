import amqp from "amqplib";

let channel: amqp.Channel;

export const EXCHANGES = {
  PAYMENT: "pagamentos",
  TICKET: "bilhetes",
};

export const QUEUES = {
  PAYMENT_APPROVED: "ms-bilhete:pagamento-aprovado",
  TICKET_GENERATED: "bilhete-gerado",
};

export const ROUTING_KEYS = {
  PAYMENT_APPROVED: "approved",
  TICKET_GENERATED: "generated",
};

export async function initRabbitMQ() {
  const connection = await amqp.connect(
    process.env.RABBITMQ_URL || "amqp://localhost:5672"
  );
  channel = await connection.createChannel();
  console.log("[✔️] Connected to RabbitMQ");

  await channel.assertExchange(EXCHANGES.PAYMENT, "direct", { durable: true });
  await channel.assertExchange(EXCHANGES.TICKET, "fanout", { durable: true });

  await channel.assertQueue(QUEUES.PAYMENT_APPROVED, { durable: true });
  await channel.assertQueue(QUEUES.TICKET_GENERATED, { durable: true });

  await channel.bindQueue(
    QUEUES.PAYMENT_APPROVED,
    EXCHANGES.PAYMENT,
    ROUTING_KEYS.PAYMENT_APPROVED
  );

  await channel.bindQueue(QUEUES.TICKET_GENERATED, EXCHANGES.TICKET, "");

  console.log("[✔️] Exchanges and queues configured");

  return channel;
}

export function getChannel() {
  if (!channel) throw new Error("RabbitMQ not initialized");
  return channel;
}
