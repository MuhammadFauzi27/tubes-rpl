import { Router } from "express";
import AuthController from "../controllers/authController.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = Router();

router.post("/register", AuthController.register);
router.post("/login", AuthController.login);
router.post("/logout", authenticate, AuthController.logout);
router.get("/me", authenticate, AuthController.me);
router.post("/change-password", authenticate, AuthController.changePassword);

export default router;
