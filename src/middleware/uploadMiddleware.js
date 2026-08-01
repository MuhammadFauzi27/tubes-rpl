import multer from "multer";
import path from "path";
import fs from "fs";

// ─── Storage config ────────────────────────────────────────────────────────────

const storage = multer.diskStorage({
  destination(req, file, cb) {
    const dir = path.resolve("uploads/menu");
    // Buat folder jika belum ada
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename(req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    const base = path.basename(file.originalname, ext)
      .replace(/\s+/g, "-")
      .replace(/[^a-zA-Z0-9-_]/g, "")
      .slice(0, 40);
    cb(null, `${Date.now()}-${base}${ext}`);
  },
});

// ─── File filter ───────────────────────────────────────────────────────────────

const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];

const fileFilter = (req, file, cb) => {
  if (ALLOWED_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    const err = new Error("Tipe file tidak didukung. Gunakan JPEG, PNG, WebP, atau GIF.");
    err.statusCode = 422;
    cb(err, false);
  }
};

// ─── Export middleware ─────────────────────────────────────────────────────────

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB
  },
});

export const uploadSingleMenu = upload.single("image");
