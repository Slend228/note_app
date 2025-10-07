import { Pool } from "pg";

// Create a new pool instance with your PostgreSQL connection details
const pool = new Pool({
  user: process.env.POSTGRES_USER || "postgres",
  host: process.env.POSTGRES_HOST || "localhost",
  database: process.env.POSTGRES_DB || "notes_app",
  password: process.env.POSTGRES_PASSWORD || "postgres",
  port: parseInt(process.env.POSTGRES_PORT || "5432"),
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : false,
});

// Export the pool without testing the connection
// This avoids the Cloudflare sockets issue in browser environments
export default pool;
