import { startPaymentApprovedConsumer } from "./payment-approved-consumer";
import { initRabbitMQ } from "./rabbitmq";
import { config } from "dotenv";

config();
await initRabbitMQ();
await startPaymentApprovedConsumer();
