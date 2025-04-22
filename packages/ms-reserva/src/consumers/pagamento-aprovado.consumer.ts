import { getChannel } from "../queue";

export async function startPagamentoAprovadoConsumer() {
  const queue = "pagamento-aprovado";
  const channel = getChannel();

  await channel.assertQueue(queue, { durable: true });

  console.log(`[🎧] Escutando fila: ${queue}`);

  channel.consume(queue, (msg) => {
    if (msg) {
      const content = msg.content.toString();
      const data = JSON.parse(content);

      console.log(`[📨] pagamento-aprovado:`, data);

      // TODO: validar assinatura, atualizar reserva no banco, etc.
      channel.ack(msg);
    }
  });
}
