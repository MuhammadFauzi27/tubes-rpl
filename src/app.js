import express from "express";
import morgan from "morgan";
import appRoute from "./routes.js";
import errorMiddleware from "./middleware/errorMiddleware.js";
import helmet from "helmet";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const createApp = () => {
  dotenv.config();
  const app = express();

  // Middleware
  app.use(express.json());
  app.use(cookieParser());
  app.use(
    cors({
      origin: true,
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    })
  );

  app.use(express.json({ limit: "4mb" }));
  app.use(express.urlencoded({ extended: false }));
  app.use(morgan("dev"));
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" },
    })
  );

  // Static file serving — gambar yang diupload bisa diakses via /uploads/...
  const uploadsDir = path.resolve(__dirname, "../../uploads");
  app.use("/uploads", express.static(uploadsDir));

  app.use("/api", appRoute);
  app.use(errorMiddleware);

  return app;
};

export default createApp;