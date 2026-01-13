import { pgTable, serial, text, real, timestamp } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// === ENUMS ===
export const SYSTEM_STATES = {
  STABLE: "STABLE",
  BOUNDARY_ZONE: "BOUNDARY_ZONE",
  UNSTABLE: "UNSTABLE",
  SYSTEM_SHOULD_HALT: "SYSTEM_SHOULD_HALT"
} as const;

export type SystemState = keyof typeof SYSTEM_STATES;

// === TABLE DEFINITIONS ===

// Stores metadata for a complete simulation session
export const simulationRuns = pgTable("simulation_runs", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
  configuration: text("configuration").$type<{
    maxEnergy: number;
    boundaryThreshold: number;
    haltThreshold: number;
  }>().notNull(),
});

// Stores individual time steps for playback/analysis
export const simulationSteps = pgTable("simulation_steps", {
  id: serial("id").primaryKey(),
  runId: serial("run_id").notNull(),
  stepIndex: serial("step_index").notNull(),
  timestamp: real("timestamp").notNull(), // Simulation time
  energy: real("energy").notNull(),
  trend: real("trend").notNull(),
  noise: real("noise").notNull(),
  calculatedState: text("calculated_state").notNull(), // SystemState
});

// === RELATIONS ===
export const simulationRunsRelations = relations(simulationRuns, ({ many }) => ({
  steps: many(simulationSteps),
}));

export const simulationStepsRelations = relations(simulationSteps, ({ one }) => ({
  run: one(simulationRuns, {
    fields: [simulationSteps.runId],
    references: [simulationRuns.id],
  }),
}));

// === BASE SCHEMAS ===
export const insertRunSchema = createInsertSchema(simulationRuns).omit({ id: true, createdAt: true });
export const insertStepSchema = createInsertSchema(simulationSteps).omit({ id: true });

// === EXPLICIT API TYPES ===

export type SimulationRun = typeof simulationRuns.$inferSelect;
export type SimulationStep = typeof simulationSteps.$inferSelect;

export type CreateRunRequest = z.infer<typeof insertRunSchema>;
export type CreateStepRequest = z.infer<typeof insertStepSchema>;

// Engine Evaluation Types
export const evaluateRequestSchema = z.object({
  energy: z.number(),
  trend: z.number(),
  noise: z.number(),
  previousState: z.enum([
    SYSTEM_STATES.STABLE, 
    SYSTEM_STATES.BOUNDARY_ZONE, 
    SYSTEM_STATES.UNSTABLE, 
    SYSTEM_STATES.SYSTEM_SHOULD_HALT
  ]).optional(),
  runId: z.number().optional(),
  stepIndex: z.number().optional(),
  timestamp: z.number().optional(),
  command: z.enum(['start_new', 'evaluate']).optional(),
  name: z.string().optional(),
  description: z.string().optional(),
  maxEnergy: z.number().optional(),
  boundaryThreshold: z.number().optional(),
  haltThreshold: z.number().optional(),
});

export type EvaluateRequest = z.infer<typeof evaluateRequestSchema>;

export interface EvaluateResponse {
  state: SystemState;
  effectiveEnergy: number; // The energy value after noise/trend application
  details: string;
  runId?: number;
  action?: string;
}
