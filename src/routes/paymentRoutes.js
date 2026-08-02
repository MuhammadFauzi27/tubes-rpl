import { Router } from "express";
import PaymentController from "../controllers/paymentController.js";
import { authenticate, authorize } from "../middleware/authMiddleware.js";

const router = Router();

// This router will be mounted at /api/v1/payments
router.get("/:id", authenticate, authorize("admin"), PaymentController.getById);

// Konfirmasi pembayaran manual oleh admin (mock — tanpa payment gateway real)
router.patch("/:id/confirm", authenticate, authorize("admin"), PaymentController.confirm);

// Webhook
router.post("/qris-callback", PaymentController.webhook);

export default router;
