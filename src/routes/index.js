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

// Health check — GET /api/v1
v1Router.get("/", (req, res) => {
  res.json({
    success: true,
    message: "API v1 is running",
    version: "1.0.0",
    endpoints: [
      "/api/v1/auth",
      "/api/v1/tables",
      "/api/v1/categories",
      "/api/v1/menu-items",
      "/api/v1/menu",
      "/api/v1/orders",
      "/api/v1/payments",
      "/api/v1/dashboard",
      "/api/v1/system",
      "/api/v1/uploads",
    ],
  });
});

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
