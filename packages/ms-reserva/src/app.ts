import express from "express";
import routes from "./routes"; // isso funciona com o alias
import { initRabbitMQ } from "./queue";
import { startPagamentoAprovadoConsumer } from "./consumers/pagamento-aprovado.consumer";
import { startPagamentoRecusadoConsumer } from "./consumers/pagamento-recusado.consumer";
import { startBilheteGeradoConsumer } from "./consumers/bilhete-gerado.consumer";

const app = express();
const port = 3000;

app.use(express.json());
app.use(routes);

app.listen(port, async () => {
  console.log(`✅ Server running at http://localhost:${port}`);

  await initRabbitMQ();

  await startPagamentoAprovadoConsumer();
  await startPagamentoRecusadoConsumer();
  await startBilheteGeradoConsumer();
  console.log("✅ All consumers started successfully.");
});
