import dotenv from "dotenv";
dotenv.config();

const config = {
  NODE_ENV: process.env.NODE_ENV,
  DATABASE_URL: process.env.DATABASE_URL,
  PORT: process.env.PORT,
  JWT_SECRET: process.env.JWT_SECRET || "your_jwt_secret_key_here",
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "24h",
};

export default config;