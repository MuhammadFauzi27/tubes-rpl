import { Router } from "express";
import OrderController from "../controllers/orderController.js";
import { authenticate, authorize, authenticateSession } from "../middleware/authMiddleware.js";

const router = Router();

// Public routes
router.post("/", authenticateSession, OrderController.create);
router.get("/:id", OrderController.getById);
router.get("/:id/status", OrderController.getStatus);

// Admin routes
router.get("/", authenticate, authorize("admin"), OrderController.getAll);
router.patch("/:id/status", authenticate, authorize("admin"), OrderController.updateStatus);

export default router;
