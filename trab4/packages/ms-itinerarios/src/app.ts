import express from "express";
import routes from "./routes"; // isso funciona com o alias
import { initRabbitMQ } from "./rabbitmq";
import { startBookingCreatedConsumer } from "./app/consumers/booking-created.consumer";
import { startBookingCanceledConsumer } from "./app/consumers/booking-canceled.consumer";

const app = express();
const port = 3002;

app.use(express.json());
app.use(routes);

app.listen(port, async () => {
  console.log(`✅ Server running at http://localhost:${port}`);

  await initRabbitMQ();

  await startBookingCreatedConsumer();
  await startBookingCanceledConsumer();
  console.log("✅ All consumers started successfully.\n\n");
});
