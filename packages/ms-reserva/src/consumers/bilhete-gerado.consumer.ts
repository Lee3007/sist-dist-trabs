import { getChannel } from "../queue";

export async function startBilheteGeradoConsumer() {
  const queue = "bilhete-gerado";
  const channel = getChannel();

  await channel.assertQueue(queue, { durable: true });

  console.log(`[🎧] Escutando fila: ${queue}`);

  channel.consume(queue, (msg) => {
    if (msg) {
      const content = msg.content.toString();
      const data = JSON.parse(content);

      console.log(`[🎟️] bilhete-gerado:`, data);

      // TODO: marcar reserva como concluída no banco
      // TODO: exibir para o usuário/atualizar status na UI

      channel.ack(msg);
    }
  });
}
