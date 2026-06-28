import { Router, type IRouter } from "express";
import healthRouter from "./health";
import universeRouter from "./v1/universe";
import dataRouter from "./v1/data";
import factorsRouter from "./v1/factors";
import signalsRouter from "./v1/signals";
import orthogonalityRouter from "./v1/orthogonality";
import researchRouter from "./v1/research";
import probabilityRouter from "./v1/probability";
import portfolioRouter from "./v1/portfolio";
import executionRouter from "./v1/execution";
import backtestRouter from "./v1/backtest";
import monitoringRouter from "./v1/monitoring";
import decayRouter from "./v1/decay";
import admissionRouter from "./v1/admission";
import registryRouter from "./v1/registry";

const router: IRouter = Router();

router.use(healthRouter);

const v1 = Router();
v1.use(universeRouter);
v1.use(dataRouter);
v1.use(factorsRouter);
v1.use(signalsRouter);
v1.use(orthogonalityRouter);
v1.use(researchRouter);
v1.use(probabilityRouter);
v1.use(portfolioRouter);
v1.use(executionRouter);
v1.use(backtestRouter);
v1.use(monitoringRouter);
v1.use(decayRouter);
v1.use(admissionRouter);
v1.use(registryRouter);

router.use("/v1", v1);

export default router;
