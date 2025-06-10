import { Booking } from "@/models";
import { getChannel, QUEUES } from "@/rabbitmq";
import { tripRepository } from "@/repositories/trip.repository";

export async function startBookingCreatedConsumer() {
  const ch = getChannel();

  console.log(`[👂] Waiting for messages in queue: ${QUEUES.BOOKING_CREATED}`);

  ch.consume(
    QUEUES.BOOKING_CREATED,
    async (msg) => {
      if (msg !== null) {
        try {
          console.log(`[📥] Received message from ${QUEUES.BOOKING_CREATED}`);

          const content = msg.content.toString();
          const bookingData = JSON.parse(content) as Booking;
          console.log(`[🔄] Updating database booking status: ${bookingData}`);

          const trip = await tripRepository.findById(bookingData.tripId);
          if (!trip) {
            throw new Error("No trip found!");
          }

          await tripRepository.update(bookingData.tripId, {
            availableCabins: trip.availableCabins - bookingData.numCabins,
          });

          ch.ack(msg);
          console.log("[✔️] Message processed successfully");
        } catch (error) {
          console.error(`[❌] Error processing message: ${error}`);
          ch.nack(msg, false, false);
        }
      }
    },
    { noAck: false }
  );
}
