import { db } from "./db";
import {
  simulationRuns,
  simulationSteps,
  type SimulationRun,
  type CreateRunRequest,
  type SimulationStep,
  type CreateStepRequest,
} from "@shared/schema";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  // Runs
  createRun(run: CreateRunRequest): Promise<SimulationRun>;
  getRuns(): Promise<SimulationRun[]>;
  getRun(id: number): Promise<SimulationRun | undefined>;
  
  // Steps
  addSteps(steps: CreateStepRequest[]): Promise<void>;
  getRunSteps(runId: number): Promise<SimulationStep[]>;
}

export class DatabaseStorage implements IStorage {
  async createRun(run: CreateRunRequest): Promise<SimulationRun> {
    const [newRun] = await db.insert(simulationRuns).values(run).returning();
    return newRun;
  }

  async getRuns(): Promise<SimulationRun[]> {
    return await db.select().from(simulationRuns).orderBy(desc(simulationRuns.createdAt));
  }

  async getRun(id: number): Promise<SimulationRun | undefined> {
    const [run] = await db.select().from(simulationRuns).where(eq(simulationRuns.id, id));
    return run;
  }

  async addSteps(steps: CreateStepRequest[]): Promise<void> {
    if (steps.length === 0) return;
    await db.insert(simulationSteps).values(steps);
  }

  async getRunSteps(runId: number): Promise<SimulationStep[]> {
    return await db.select()
      .from(simulationSteps)
      .where(eq(simulationSteps.runId, runId))
      .orderBy(simulationSteps.stepIndex);
  }
}

export const storage = new DatabaseStorage();
