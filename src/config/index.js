import dotenv from "dotenv";
dotenv.config();

const config = {
  NODE_ENV: process.env.NODE_ENV,
  DATABASE_URL: process.env.DATABASE_URL,
  PORT: process.env.PORT,
};

export default config;