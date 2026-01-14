-- PostgreSQL database schema for DigitalTwin-Engine

fOR LOCAL PC SUCH AS WINDOWS
# Database Setup Guide

## 1. Local Development (Windows)

### Prerequisites
- **PostgreSQL** must be installed
- **pgAdmin** (optional, for GUI management)

### Setup Steps:
1. **Download & Install**:
   - Download PostgreSQL from: https://www.postgresql.org/download/windows/
   - Run installer with default options
   - Remember the password you set for `postgres` user

2. **Create Database**:
   ```bash
   createdb -U postgres digitaltwin

-- This file is for reference only. Actual schema is managed by Drizzle ORM.
-- See drizzle/0000_aromatic_dragon_man.sql for the exact schema.

-- Simulation metadata
CREATE TABLE "simulation_runs" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now(),
	"configuration" json NOT NULL
);

-- Simulation step data
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

-- Performance indexes
CREATE INDEX idx_simulation_steps_run_id ON simulation_steps(run_id);
CREATE INDEX idx_simulation_steps_timestamp ON simulation_steps(timestamp);
