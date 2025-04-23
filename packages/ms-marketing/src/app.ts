import express from 'express';
import routes from './routes';
import { initRabbitMQ } from './rabbitmq';

const app = express();
const port = 3001;

app.use(express.json());
app.use(routes);

app.listen(port, async () => {
    console.log(`✅ Server running at http://localhost:${port}`);
  
    await initRabbitMQ();
});
