import { db } from './db';
import { simulationRuns, simulationSteps } from '@shared/schema';
import { eq, desc } from 'drizzle-orm';

export class MemoryLimit {
  constructor() {
    // PostgreSQL handles storage server-side, no file-based limits needed
  }

  async enforceMemoryLimit(): Promise<void> {
    try {
      // PostgreSQL handles storage limits server-side
      const runs = await db
        .select({
          id: simulationRuns.id,
          name: simulationRuns.name,
          createdAt: simulationRuns.createdAt,
        })
        .from(simulationRuns)
        .orderBy(desc(simulationRuns.createdAt));

      // Keep only the most recent run, delete all others
      if (runs.length > 1) {
        let deletedRuns = 0;
        
        // Delete all runs except the first (most recent) one
        for (let i = 1; i < runs.length; i++) {
          const run = runs[i];
          
          // Delete all steps for this run
          await db
            .delete(simulationSteps)
            .where(eq(simulationSteps.runId, run.id));

          // Delete the run
          await db
            .delete(simulationRuns)
            .where(eq(simulationRuns.id, run.id));

          deletedRuns++;
          console.log(`Deleted run "${run.name}" to keep only latest run`);
        }
      }
    } catch (error) {
      console.error('Error enforcing memory limit:', error);
    }
  }

  async getDetailedStats(): Promise<{
    runCount: number;
    stepCount: number;
  }> {
    const [runCount, stepCount] = await Promise.all([
      db.select({ count: simulationRuns.id }).from(simulationRuns).then(rows => rows.length),
      db.select({ count: simulationSteps.id }).from(simulationSteps).then(rows => rows.length)
    ]);

    return {
      runCount,
      stepCount,
    };
  }
}

// Create instance
export const memoryLimit = new MemoryLimit();
