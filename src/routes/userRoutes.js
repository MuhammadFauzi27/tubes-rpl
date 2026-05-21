import { Router } from "express";
import UserController from "../controllers/userController.js";
import { authenticate, authorize } from "../middleware/authMiddleware.js";

const router = Router();

// All user management routes are admin only
router.use(authenticate, authorize("admin"));

router.get("/", UserController.getAll);
router.post("/", UserController.create);
router.get("/:id", UserController.getById);
router.patch("/:id", UserController.update);
router.delete("/:id", UserController.delete);

export default router;
