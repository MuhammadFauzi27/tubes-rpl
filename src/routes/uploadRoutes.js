import { Router } from "express";
import { authenticate, authorize } from "../middleware/authMiddleware.js";
import { uploadSingleMenu } from "../middleware/uploadMiddleware.js";
import UploadController from "../controllers/uploadController.js";

const router = Router();

/**
 * POST /api/v1/uploads/menu
 * Upload gambar untuk menu item.
 * Request: multipart/form-data  field: image
 * Response: { success: true, data: { image_url: "/uploads/menu/..." } }
 */
router.post(
  "/menu",
  authenticate,
  authorize("admin"),
  (req, res, next) => {
    uploadSingleMenu(req, res, (err) => {
      if (err) {
        // Handle multer errors (ukuran, tipe file, dll)
        err.statusCode = err.statusCode || 422;
        return next(err);
      }
      next();
    });
  },
  UploadController.uploadMenuImage
);

export default router;
