import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import universeRouter from "./universe.js";
import dataRouter from "./data.js";
import factorsRouter from "./factors.js";
import tradingCalendarRouter from "./trading-calendar.js";
import executionRouter from "./execution.js";
import registryRouter from "./registry.js";
import monitoringRouter from "./monitoring.js";
import { authenticate } from "../lib/auth.js";

const router: IRouter = Router();

router.use(healthRouter);

// Protected Routes
router.use("/v1/universe", authenticate, universeRouter);
router.use("/v1/data", authenticate, dataRouter);
router.use("/v1/factors", authenticate, factorsRouter);
router.use("/v1/trading-calendar", authenticate, tradingCalendarRouter);
router.use("/v1/execution", authenticate, executionRouter);
router.use("/v1/registry", authenticate, registryRouter);
router.use("/v1/monitoring", authenticate, monitoringRouter);

export default router;
