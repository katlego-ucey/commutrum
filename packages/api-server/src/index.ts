import express from "express";
import cors from "cors";
import { logger } from "./lib/logger";
import router from "./routes/index";

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// API Routes
app.use("/api", router);

app.listen(port, () => {
  logger.info(`Commutrum API server listening at http://localhost:${port}`);
});
