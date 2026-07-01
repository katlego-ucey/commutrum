import { Router, type IRouter } from "express";
import healthRouter from "./health";
import universeRouter from "./universe";
import dataRouter from "./data";
import factorsRouter from "./factors";
import tradingCalendarRouter from "./trading-calendar";
import executionRouter from "./execution";
import registryRouter from "./registry";
import monitoringRouter from "./monitoring";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/v1/universe", universeRouter);
router.use("/v1/data", dataRouter);
router.use("/v1/factors", factorsRouter);
router.use("/v1/trading-calendar", tradingCalendarRouter);
router.use("/v1/execution", executionRouter);
router.use("/v1/registry", registryRouter);
router.use("/v1/monitoring", monitoringRouter);

export default router;
