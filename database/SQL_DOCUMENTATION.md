# SQL Documentation - Digital Twin Engine

## Database Overview
- **Database**: PostgreSQL 15+
- **ORM**: Drizzle ORM
- **Schema Location**: `../shared/schema.ts`

## Table Schemas

### 1. simulation_runs
Stores metadata for complete simulation sessions.

```sql
CREATE TABLE "simulation_runs" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now(),
	"configuration" json NOT NULL
);
```

**Columns:**
- `id` - Auto-incrementing primary key
- `name` - Simulation name (required)
- `description` - Optional description
- `created_at` - Timestamp when simulation was created
- `configuration` - JSON object with simulation parameters:
  ```json
  {
    "maxEnergy": number,
    "boundaryThreshold": number,
    "haltThreshold": number
  }
  ```

### 2. simulation_steps
Stores individual time steps for simulation playback and analysis.

```sql
CREATE TABLE "simulation_steps" (
	"id" serial PRIMARY KEY NOT NULL,
	"run_id" integer NOT NULL,
	"step_index" integer NOT NULL,
	"timestamp" real NOT NULL,
	"energy" real NOT NULL,
	"trend" real NOT NULL,
	"noise" real NOT NULL,
	"calculated_state" text NOT NULL
);
```

**Columns:**
- `id` - Auto-incrementing primary key
- `run_id` - Integer reference to simulation_runs (foreign key handled by application)
- `step_index` - Sequential step number within the simulation
- `timestamp` - Simulation time (real data type)
- `energy` - Current energy level
- `trend` - Energy trend factor
- `noise` - Random noise factor
- `calculated_state` - System state: STABLE, BOUNDARY_ZONE, UNSTABLE, or SYSTEM_SHOULD_HALT

## Indexes

```sql
-- Performance indexes
CREATE INDEX idx_simulation_steps_run_id ON simulation_steps(run_id);
CREATE INDEX idx_simulation_steps_timestamp ON simulation_steps(timestamp);
```

## Common SQL Queries

### Get All Simulation Runs
```sql
SELECT id, name, description, created_at, configuration
FROM simulation_runs
ORDER BY created_at DESC;
```

### Get Steps for a Specific Run
```sql
SELECT step_index, timestamp, energy, trend, noise, calculated_state
FROM simulation_steps
WHERE run_id = [RUN_ID]
ORDER BY step_index;
```

### Get Latest Simulation Run
```sql
SELECT * FROM simulation_runs
ORDER BY created_at DESC
LIMIT 1;
```

### Count Steps per Run
```sql
SELECT 
    r.id,
    r.name,
    COUNT(s.id) as step_count
FROM simulation_runs r
LEFT JOIN simulation_steps s ON r.id = s.run_id
GROUP BY r.id, r.name
ORDER BY r.created_at DESC;
```

### Get Runs by State
```sql
SELECT DISTINCT
    r.id,
    r.name,
    s.calculated_state as last_state
FROM simulation_runs r
JOIN simulation_steps s ON r.id = s.run_id
WHERE s.step_index = (
    SELECT MAX(step_index) 
    FROM simulation_steps 
    WHERE run_id = r.id
);
```

## Database Setup

### 1. Create Database
```bash
# Using PostgreSQL CLI
createdb -U postgres digitaltwin

# Or using psql
CREATE DATABASE digitaltwin;
```

### 2. Create Tables
```bash
# Run the schema file
psql -U postgres -d digitaltwin -f database/schema.sql
```

### 3. Verify Setup
```sql
-- List tables
\dt

-- Check table structures
\d simulation_runs
\d simulation_steps
```

## Data Types Explained

### JSON Configuration
The `configuration` column stores simulation parameters:
- `maxEnergy`: Maximum energy threshold (e.g., 1.5)
- `boundaryThreshold`: Boundary zone threshold (e.g., 0.8)
- `haltThreshold`: Critical halt threshold (e.g., 1.0)

### System States
The `calculated_state` column uses these values:
- `STABLE` - System operating normally
- `BOUNDARY_ZONE` - Approaching critical limits
- `UNSTABLE` - System exhibiting unstable behavior
- `SYSTEM_SHOULD_HALT` - Critical instability detected

## Performance Considerations

- Indexes are created on `run_id` and `timestamp` for fast queries
- JSONB is used for configuration storage (better than JSON for indexing)
- Cascade delete ensures data integrity when runs are deleted
- Consider partitioning by date for large datasets

## Migration with Drizzle

```bash
# Push schema changes to database
npm run db:push

# Generate migration files
npx drizzle-kit generate

# Apply migrations
npx drizzle-kit migrate
```
