CREATE TABLE "simulation_runs" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now(),
	"configuration" json NOT NULL
);
--> statement-breakpoint
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
