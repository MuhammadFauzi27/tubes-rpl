import { Router } from "express";
import authRoutes from "./authRoutes.js";
import userRoutes from "./userRoutes.js";

const v1Router = Router();

v1Router.use("/auth", authRoutes);
v1Router.use("/users", userRoutes);

export default v1Router;
