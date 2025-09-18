// create-table.js
import { Client } from "@neondatabase/serverless";
import dotenv from "dotenv";

dotenv.config(); // load .env

const db = new Client({ connectionString: process.env.DATABASE_URL });

async function createTable() {
  try {
    await db.connect();

    await db.query(`
      CREATE TABLE IF NOT EXISTS repos (
        id SERIAL PRIMARY KEY,
        clerk_user_id TEXT NOT NULL,
        github_repo_id BIGINT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        github_token TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    console.log("✅ Table 'repos' created successfully!");
  } catch (err) {
    console.error("❌ Error creating table:", err);
  } finally {
    await db.end();
  }
}

createTable();
