import { startBookingsConsumer } from "./consumers/booking.consumer";
import { approvePayment } from "./producers/approved-payment.producer";
import { rejectPayment } from "./producers/rejected-payment.producer";
import { initRabbitMQ } from "./queue";
import { config } from "dotenv";

config();
await initRabbitMQ();
await startBookingsConsumer(async (booking) => {
  const shouldRejectPaymentForBooking = getRandomInt(2) === 0;

  if (shouldRejectPaymentForBooking) {
    await rejectPayment(booking);
  } else {
    await approvePayment(booking);
  }
});

function getRandomInt(max: number) {
  return Math.floor(Math.random() * max);
}
