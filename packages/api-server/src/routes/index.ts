import { Router, type IRouter } from "express";
import healthRouter from "./health";
import universeRouter from "./universe";
import dataRouter from "./data";
import factorsRouter from "./factors";
import tradingCalendarRouter from "./trading-calendar";
import executionRouter from "./execution";
import registryRouter from "./registry";
import monitoringRouter from "./monitoring";
import { authenticate } from "../lib/auth";

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
