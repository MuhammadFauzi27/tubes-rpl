import pg from "pg";
import config from "../config/index.js";


const pool = new pg.Pool({
  connectionString: config.DATABASE_URL
});

pool.on('connect', () => {
  console.log('Database Connect');
});

pool.on('error', () => {
  console.log('Database Error');
});

export default {
  pool
};