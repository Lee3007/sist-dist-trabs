import { getChannel } from "../queue";

export async function startPagamentoRecusadoConsumer() {
  const queue = "pagamento-recusado";
  const channel = getChannel();

  await channel.assertQueue(queue, { durable: true });

  console.log(`[🎧] Escutando fila: ${queue}`);

  channel.consume(queue, (msg) => {
    if (msg) {
      const content = msg.content.toString();
      const data = JSON.parse(content);

      console.log(`[❌] pagamento-recusado:`, data);

      // TODO: validar assinatura
      // TODO: cancelar a reserva no banco
      // TODO: notificar usuário

      channel.ack(msg);
    }
  });
}
