import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from "@shared/schema";
import * as dotenv from 'dotenv';
dotenv.config();

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = mysql.createPool({
  uri: process.env.DATABASE_URL,
  connectionLimit: 10,
  acquireTimeout: 60000,
  idleTimeout: 300000,
  queueLimit: 0
});

export const db = drizzle(pool, { schema, mode: 'default' });
