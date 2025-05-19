import { getChannel, QUEUES } from "../../rabbitmq";

export async function sendBookingCreatedMessage(
  bookingData: string
): Promise<void> {
  const ch = getChannel();

  try {
    // Publicando a mensagem no canal
    ch.sendToQueue(QUEUES.BOOKING_CREATED, Buffer.from(bookingData));
    console.log(
      `[📤] Sent message to ${QUEUES.BOOKING_CREATED}: ${bookingData}`
    );
  } catch (error: any) {
    console.error(`[❌] Error sending message: ${error.message}`);
  }
}
