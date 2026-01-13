import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as schema from "@shared/schema";

const sqlitePath = process.env.DATABASE_URL?.replace('file:', '') || 'sqlite.db';
const sqlite = new Database(sqlitePath);
export const db = drizzle(sqlite, { schema });
