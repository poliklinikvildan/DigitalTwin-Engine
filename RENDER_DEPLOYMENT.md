# Deploying to Render.com with PostgreSQL

## Current Setup (Local Development)
- **Database**: SQLite (`sqlite.db`)
- **Storage Limits**: 100MB, 1000 runs, 10,000 steps/run
- **File-based**: Database stored in project directory

## Why PostgreSQL is Better for Render

### Problems with SQLite on Render:
1. ❌ **Ephemeral filesystem** - Render deletes files between deploys
2. ❌ **No persistence** - Your `sqlite.db` file gets deleted
3. ❌ **Not scalable** - Single-file database not ideal for production

### Benefits of PostgreSQL on Render:
1. ✅ **Persistent** - Data survives deploys
2. ✅ **Managed** - Render handles backups, updates
3. ✅ **Scalable** - Handles unlimited runs/steps
4. ✅ **Easy setup** - Free tier available on Render

---

## Setup Instructions

### Step 1: Create Render PostgreSQL Database
1. Go to [render.com](https://render.com)
2. Sign up or login
3. Click "New" → "PostgreSQL"
4. Fill in:
   - **Name**: `vldn-db`
   - **Database**: `vldn`
   - **Region**: Same as your service
   - **PostgreSQL Version**: 15
5. Click "Create Database"
6. **Copy the internal database URL** (you'll need it)

### Step 2: Update Your Code for PostgreSQL

**Install PostgreSQL driver:**
```bash
npm install pg
```

**Update `server/db.ts`:**
```typescript
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "@shared/schema";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL environment variable is required");
}

const pool = new Pool({
  connectionString: databaseUrl,
});

export const db = drizzle(pool, { schema });
```

**Update `server/index.ts`** - Remove file-based limits:
```typescript
// Remove: import { memoryLimit } from "./memory-limit";
// Remove: import { storageManager } from "./storage-manager";
// The database handles limits automatically on Render
```

**Update routes.ts** - Remove storage enforcement:
```typescript
// In app.post(api.runs.create.path):
// Remove: await storageManager.enforceLimits();
// Render PostgreSQL is unlimited on hobby tier
```

### Step 3: Deploy to Render

1. Push your code to GitHub
2. Create new Render Service:
   - Click "New" → "Web Service"
   - Connect your GitHub repo
   - Fill in:
     - **Name**: `vldn-engine`
     - **Environment**: `Node`
     - **Build Command**: `npm install && npm run build`
     - **Start Command**: `npm run start`
     - **Region**: Same as database

3. Add Environment Variables:
   - **DATABASE_URL**: Paste your Postgres internal URL from Step 1
   - Example: `postgresql://user:password@host:5432/vldn`

4. Click "Create Web Service"

5. Wait for deployment (5-10 minutes)

### Step 4: Run Migrations on Render
```bash
# In your local terminal, connect to Render's database
export DATABASE_URL="your_render_postgres_url"
npm run db:migrate  # or equivalent drizzle migration command
```

---

## Environment Variables

**For local development** (`.env`):
```
DATABASE_URL=sqlite.db
NODE_ENV=development
```

**For Render production**:
```
DATABASE_URL=postgresql://user:password@host:5432/vldn
NODE_ENV=production
```

---

## Storage Comparison

| Feature | SQLite (Local) | PostgreSQL (Render) |
|---------|----------------|-------------------|
| Size Limit | 100MB | Unlimited (hobby tier) |
| Max Runs | 1,000 | Unlimited |
| Max Steps/Run | 10,000 | Unlimited |
| Persistent | ⚠️ Ephemeral | ✅ Persistent |
| Backups | None | Automatic |
| Cost | Free | Free (hobby tier) |

---

## Monitoring on Render

1. Go to your service dashboard
2. View **Logs** tab for real-time errors
3. Check **Metrics** for CPU/memory usage
4. Use `/api/debug/runs` endpoint to check data:
   ```
   https://your-render-url.onrender.com/api/debug/runs
   ```

---

## Troubleshooting

**Error: DATABASE_URL not found**
- Add environment variable in Render dashboard

**Error: Connection refused**
- Make sure database is in same region as service
- Check database status in Render dashboard

**Data disappeared after deploy**
- You were using SQLite - migrate to PostgreSQL
- SQLite files don't persist on Render

---

## Next Steps

1. Modify code for PostgreSQL (see Step 2)
2. Test locally with PostgreSQL
3. Create Render services (database + web service)
4. Deploy and monitor

Questions? Check Render docs: https://render.com/docs/databases

