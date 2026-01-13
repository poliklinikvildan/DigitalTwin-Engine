# Render.com Deployment Guide for VLDN Engine

## Quick Start (5 minutes)

### Step 1: Go to Render Dashboard
1. Sign up at [render.com](https://render.com)
2. Click "New +" button
3. Select "Web Service"
4. Connect your GitHub account and authorize

### Step 2: Select Your Repository
1. Search for `DigitalTwin-Engine`
2. Click "Connect"
3. Fill in details:
   - **Name**: `vldn-engine`
   - **Region**: `Oregon` (or closest to you)
   - **Branch**: `main`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run start`

### Step 3: Set Environment Variables
Click "Advanced" and add:
```
NODE_ENV=production
```

### Step 4: Choose Plan
- **Free Plan**: Spins down after 15 minutes of inactivity (fine for testing)
- **Paid Plan**: Always running ($7/month)

### Step 5: Deploy!
Click "Create Web Service" and wait 5-10 minutes

Your app will be at: `https://vldn-engine.onrender.com`

---

## ⚠️ About Your Database

### Current Setup (SQLite)
- ✅ Works immediately
- ❌ Data lost on deploy (Render's ephemeral filesystem)
- ✅ Free
- Use for: Testing only

### Production Setup (PostgreSQL)
- ✅ Data persists
- ✅ Automatic backups
- ✅ Free tier available (limited)
- ❌ Need to convert code first

---

## Option A: Deploy Now with SQLite (Fastest)

Just follow Quick Start above. Your app will work but lose data on each deploy.

**Pros**: Instant deployment
**Cons**: Data doesn't persist

---

## Option B: Deploy with PostgreSQL (Production-Ready)

### Create PostgreSQL Database

1. In Render dashboard, click "New +"
2. Select "PostgreSQL"
3. Fill in:
   - **Name**: `vldn-db`
   - **Database**: `vldn`
   - **Region**: Same as web service
   - **Plan**: Free tier
4. Click "Create Database"
5. Copy the **Internal Database URL** (starts with `postgresql://`)

### Update Your Code

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

**Remove from `server/index.ts`:**
```typescript
// Remove these lines:
// import { memoryLimit } from "./memory-limit";
```

**Update `server/routes.ts`:**
```typescript
// In app.post(api.runs.create.path):
// Remove: await memoryLimit.enforceMemoryLimit();
// Or replace with: await storageManager.enforceLimits();
```

### Deploy with PostgreSQL

1. In Render web service settings, add environment variable:
   - **Key**: `DATABASE_URL`
   - **Value**: Paste the PostgreSQL URL from step 5
2. Deploy (it will rebuild automatically)

---

## GitHub Actions Auto-Deploy

The `.github/workflows/deploy.yml` file automatically deploys when you push to `main`.

**To enable it:**

1. Go to your Render service settings
2. Copy the **Deploy Hook** URL
3. Go to GitHub repo → Settings → Secrets
4. Add secret:
   - **Name**: `RENDER_DEPLOY_HOOK`
   - **Value**: Paste the hook URL

Every push to `main` will auto-deploy!

---

## Checking Your Deployment

Once deployed:

### Test the API
```
https://your-service-name.onrender.com/api/debug/runs
```

### View Logs
- Go to Render service dashboard
- Click "Logs" tab
- Check for errors

### Troubleshooting
| Problem | Solution |
|---------|----------|
| 503 Service Unavailable | Wait 5 minutes for spin-up, then refresh |
| Build fails | Check "Logs" tab for error details |
| Database connection error | Check DATABASE_URL environment variable |
| Data lost after deploy | You're using SQLite - switch to PostgreSQL |

---

## Cost Breakdown

| Component | Free | Paid |
|-----------|------|------|
| Web Service | Spins down after 15m idle | Always running ($7/month) |
| PostgreSQL | 256 MB (limited) | Scales up ($15/month+) |
| **Total** | **Free** | **~$22/month** |

---

## Next Steps

1. **Deploy Now**: Follow Quick Start (SQLite)
2. **Add Database**: Follow Option B (PostgreSQL)
3. **Monitor**: Check logs regularly
4. **Scale**: Upgrade plan if needed

Questions? Check [Render docs](https://render.com/docs)

