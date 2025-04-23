import { startBookingsConsumer } from "./booking-consumer";
import { processPayment } from "./process-payment";
import { initRabbitMQ } from "./rabbitmq";
import { config } from "dotenv";

config();
await initRabbitMQ();
await startBookingsConsumer(async (message) => {
  const shouldApprovePayment = getRandomInt(2) === 0;

  await processPayment(message, shouldApprovePayment)
});

function getRandomInt(max: number) {
  return Math.floor(Math.random() * max);
}
