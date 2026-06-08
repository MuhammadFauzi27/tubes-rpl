import { Router } from "express";
import PaymentController from "../controllers/paymentController.js";
import { authenticate, authorize } from "../middleware/authMiddleware.js";

const router = Router();

// This router will be mounted at /api/v1/payments
router.get("/:id", authenticate, authorize("admin"), PaymentController.getById);

// Webhook
router.post("/qris-callback", PaymentController.webhook);

export default router;
