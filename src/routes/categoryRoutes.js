import { Router } from "express";
import CategoryController from "../controllers/categoryController.js";
import { authenticate, authorize } from "../middleware/authMiddleware.js";

const router = Router();

// Public route
router.get("/", CategoryController.getAll);

// Admin routes
router.post("/", authenticate, authorize("admin"), CategoryController.create);
router.patch("/:id", authenticate, authorize("admin"), CategoryController.update);
router.delete("/:id", authenticate, authorize("admin"), CategoryController.delete);

export default router;
