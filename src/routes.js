import { Router } from "express";
import v1Router from "./routes/index.js";

const appRoute = Router();

appRoute.use("/v1", v1Router);

export default appRoute;