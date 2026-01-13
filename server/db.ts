import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "@shared/schema";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import path from "path";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL environment variable is required');
}

const pool = new Pool({
  connectionString: databaseUrl,
});

export const db = drizzle(pool, { schema });

// Run migrations on startup
export async function initializeDatabase() {
  try {
    // In production, migrations are copied to dist/drizzle
    const migrationsFolder = process.env.NODE_ENV === 'production'
      ? path.join(process.cwd(), 'drizzle')
      : path.join(process.cwd(), 'drizzle');
    
    await migrate(db, { migrationsFolder });
    console.log('Database migrations completed successfully');
  } catch (error) {
    console.error('Database migration failed:', error);
    throw error;
  }
}
