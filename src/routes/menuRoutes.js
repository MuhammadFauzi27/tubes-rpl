import { Router } from "express";
import MenuController from "../controllers/menuController.js";

const router = Router();

router.get("/", MenuController.getPublicMenu);

export default router;
