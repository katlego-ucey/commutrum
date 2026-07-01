import express, { type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import { logger } from "./lib/logger.js";
import router from "./routes/index.js";

const app = express();
const port = process.env.PORT || 3000;

app.use(helmet());
app.use(cors());
app.use(express.json());

// API Routes
app.use("/api", router);

// Global Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  logger.error({ err, url: req.url, method: req.method }, "Unhandled error");
  res.status(500).json({ error: "Internal Server Error" });
});

app.listen(port, () => {
  logger.info(`Commutrum API server listening at http://localhost:${port}`);
});
