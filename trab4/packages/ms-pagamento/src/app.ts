import express from "express";
import routes from "./routes";
import { processPayment } from "./process-payment";
import { initRabbitMQ } from "./rabbitmq";
import { config } from "dotenv";

const app = express();
const port = 3003;
app.use(express.json());
app.use(routes);

app.listen(port, async () => {
  console.log(`✅ Server running at http://localhost:${port}`);
  config();
  await initRabbitMQ();

  console.log("✅ All consumers started successfully.\n\n");
});
