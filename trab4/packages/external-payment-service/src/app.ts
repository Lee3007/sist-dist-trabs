import express from "express";
import routes from "./routes"; // isso funciona com o alias

const app = express();
const port = 3100;

app.use(express.json());
app.use(routes);

app.listen(port, async () => {
  console.log(`✅ Server running at http://localhost:${port}`);
});
