import amqp from "amqplib";

let channel: amqp.Channel;

export async function initRabbitMQ() {
  const connection = await amqp.connect(
    process.env.RABBITMQ_URL || "amqp://localhost:5672"
  );
  channel = await connection.createChannel();
  console.log("[✔️] Conectado ao RabbitMQ");
  return channel;
}

export function getChannel() {
  if (!channel) throw new Error("RabbitMQ não inicializado");
  return channel;
}
