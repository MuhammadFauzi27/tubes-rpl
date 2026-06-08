import { Router } from "express";
import TableController from "../controllers/tableController.js";
import { authenticate, authorize } from "../middleware/authMiddleware.js";

const router = Router();

// Public route for customers scanning QR
router.get("/scan/:token", TableController.scanQR);

// Admin only routes
router.get("/", authenticate, authorize("admin"), TableController.getAll);
router.post("/", authenticate, authorize("admin"), TableController.create);
router.get("/:id", authenticate, authorize("admin"), TableController.getById);
router.patch("/:id", authenticate, authorize("admin"), TableController.update);
router.delete("/:id", authenticate, authorize("admin"), TableController.delete);
router.post("/:id/regenerate-qr", authenticate, authorize("admin"), TableController.regenerateQR);

export default router;
