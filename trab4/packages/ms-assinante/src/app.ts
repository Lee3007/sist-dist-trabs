import { initRabbitMQ } from "./rabbitmq";
import { startAllConsumers } from "./start-all-consumers";
import { config } from "dotenv";

config();
await initRabbitMQ();

const destinations = process.env.DESTINATIONS?.split(",") || [];
const email = process.env.EMAIL || "eu@eumesmo.com";

await startAllConsumers(email, destinations);
console.log(
  `✅ Esperando promoções para ${email} em ${destinations.join(", ")}`
);
