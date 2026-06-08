import { Router } from "express";
import authRoutes from "./authRoutes.js";
import tableRoutes from "./tableRoutes.js";

const v1Router = Router();
v1Router.use("/tables", tableRoutes);

v1Router.use("/auth", authRoutes);

export default v1Router;
