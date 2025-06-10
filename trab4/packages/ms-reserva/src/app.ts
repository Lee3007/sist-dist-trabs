import express from "express";
import routes from "./routes";
import { initRabbitMQ } from "./rabbitmq";
import { startPaymentApprovedConsumer } from "./consumers/payment-approved.consumer";
import { startPaymentRejectedConsumer } from "./consumers/payment-rejected.consumer";
import { startTicketGeneratedConsumer } from "./consumers/ticket-generated.consumer";
import { startPromotionConsumer } from "./consumers/promotion.consumer";

const app = express();
const port = 3000;

app.use(express.json());
app.use(routes);

app.listen(port, async () => {
  console.log(`✅ Server running at http://localhost:${port}`);

  await initRabbitMQ();

  await startPromotionConsumer();
  await startPaymentApprovedConsumer();
  await startPaymentRejectedConsumer();
  await startTicketGeneratedConsumer();
  console.log("✅ All consumers started successfully.\n\n");
});
