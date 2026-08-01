import { Router } from "express";
import authRoutes from "./authRoutes.js";
import tableRoutes from "./tableRoutes.js";
import categoryRoutes from "./categoryRoutes.js";
import menuItemRoutes from "./menuItemRoutes.js";
import menuRoutes from "./menuRoutes.js";
import orderRoutes from "./orderRoutes.js";
import paymentRoutes from "./paymentRoutes.js";
import dashboardRoutes from "./dashboardRoutes.js";
import systemRoutes from "./systemRoutes.js";
import uploadRoutes from "./uploadRoutes.js";

const v1Router = Router();
v1Router.use("/tables", tableRoutes);
v1Router.use("/categories", categoryRoutes);
v1Router.use("/menu-items", menuItemRoutes);
v1Router.use("/menu", menuRoutes);
v1Router.use("/orders", orderRoutes);
v1Router.use("/payments", paymentRoutes);
v1Router.use("/dashboard", dashboardRoutes);
v1Router.use("/system", systemRoutes);
v1Router.use("/uploads", uploadRoutes);

v1Router.use("/auth", authRoutes);

export default v1Router;
