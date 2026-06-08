import { Router } from "express";
import MenuItemController from "../controllers/menuItemController.js";
import { authenticate, authorize } from "../middleware/authMiddleware.js";

const router = Router();

// Public route
router.get("/:id", MenuItemController.getById);

// Admin routes
router.get("/", authenticate, authorize("admin"), MenuItemController.getAll);
router.post("/", authenticate, authorize("admin"), MenuItemController.create);
router.patch("/:id", authenticate, authorize("admin"), MenuItemController.update);
router.delete("/:id", authenticate, authorize("admin"), MenuItemController.delete);
router.patch("/:id/toggle-availability", authenticate, authorize("admin"), MenuItemController.toggleAvailability);

export default router;
