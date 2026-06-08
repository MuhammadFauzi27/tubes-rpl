import { Router } from "express";
import { DashboardController } from "../controllers/index.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = Router();

router.get("/summary", authenticate, DashboardController.getSummary);
router.get("/revenue-stats", authenticate, DashboardController.getRevenueStats);

export default router;
