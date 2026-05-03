import express from "express";
import morgan from "morgan";
import appRoute from "./routes.js";
import errorMiddleware from "./middleware/errorMiddleware.js";
import helmet from "helmet";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";

const createApp = () => {
  dotenv.config();
  const app = express();

  // Middleware
  app.use(express.json());
  app.use(cookieParser());
  app.use(
    cors({
      origin: [
        "http://localhost:5174",
        "http://localhost:5173",
      ],
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    })
  );

  app.use(express.json({ limit: "4mb" }));
  app.use(express.urlencoded({ extended: false }));
  app.use(morgan("dev"));
  app.use(helmet());
  app.use("/api", appRoute);
  app.use(errorMiddleware);

  return app;
};

export default createApp;