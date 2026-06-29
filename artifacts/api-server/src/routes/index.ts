import { Router, type IRouter } from "express";
import healthRouter from "./health";
import factorsRouter from "./v1/factors";
import researchRouter from "./v1/research";
import portfolioRouter from "./v1/portfolio";
import monitoringRouter from "./v1/monitoring";
import registryRouter from "./v1/registry";

const router: IRouter = Router();

router.use(healthRouter);

router.use("/v1/factors", factorsRouter);
router.use("/v1/research", researchRouter);
router.use("/v1/portfolio", portfolioRouter);
router.use("/v1/monitoring", monitoringRouter);
router.use("/v1/registry", registryRouter);

export default router;
