import { EXCHANGES, getChannel, QUEUES, ROUTING_KEYS } from "../../rabbitmq";

export async function sendBookingCreatedMessage(
  bookingData: string
): Promise<void> {
  const ch = getChannel();

  try {
    ch.publish(
      EXCHANGES.BOOKING,
      ROUTING_KEYS.BOOKING_CREATED,
      Buffer.from(bookingData),
      { persistent: true }
    );
    console.log(
      `[📤] Sent message to ${QUEUES.BOOKING_CREATED}: ${bookingData}`
    );
  } catch (error: any) {
    console.error(`[❌] Error sending message: ${error.message}`);
  }
}

export async function sendBookingCanceledMessage(
  bookingData: string
): Promise<void> {
  const ch = getChannel();

  try {
    ch.publish(
      EXCHANGES.BOOKING,
      ROUTING_KEYS.BOOKING_CANCELED,
      Buffer.from(bookingData),
      { persistent: true }
    );
    console.log(
      `[📤] Sent message to ${QUEUES.BOOKING_CREATED}: ${bookingData}`
    );
  } catch (error: any) {
    console.error(`[❌] Error sending message: ${error.message}`);
  }
}
