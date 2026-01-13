import fs from 'fs';
import path from 'path';
import { db } from './db';
import { simulationRuns, simulationSteps } from '@shared/schema';

export class StorageManager {
  private readonly maxDbSizeBytes: number;
  private readonly maxRuns: number;
  private readonly maxStepsPerRun: number;

  constructor(
    maxDbSizeBytes: number = 100 * 1024 * 1024, // 100MB default
    maxRuns: number = 1000,
    maxStepsPerRun: number = 10000
  ) {
    this.maxDbSizeBytes = maxDbSizeBytes;
    this.maxRuns = maxRuns;
    this.maxStepsPerRun = maxStepsPerRun;
  }

  async enforceLimits(): Promise<void> {
    await this.enforceSizeLimit();
    await this.enforceRunCountLimit();
    await this.enforceStepsPerRunLimit();
  }

  private async enforceSizeLimit(): Promise<void> {
    const dbPath = path.join(process.cwd(), 'sqlite.db');
    
    if (!fs.existsSync(dbPath)) return;

    const stats = fs.statSync(dbPath);
    const currentSize = stats.size;

    if (currentSize > this.maxDbSizeBytes) {
      console.log(`Database size (${currentSize} bytes) exceeds limit (${this.maxDbSizeBytes} bytes)`);
      
      // Delete oldest runs until size is under limit
      const runs = await db.select({ id: simulationRuns.id, createdAt: simulationRuns.createdAt })
        .from(simulationRuns)
        .orderBy(simulationRuns.createdAt);

      let deletedCount = 0;
      for (const run of runs) {
        // Delete the run and its steps
        await db.delete(simulationSteps).where(eq(simulationSteps.runId, run.id));
        await db.delete(simulationRuns).where(eq(simulationRuns.id, run.id));
        deletedCount++;

        // Check size again
        const newStats = fs.statSync(dbPath);
        if (newStats.size <= this.maxDbSizeBytes) {
          break;
        }
      }

      console.log(`Deleted ${deletedCount} oldest runs to enforce size limit`);
    }
  }

  private async enforceRunCountLimit(): Promise<void> {
    const runCount = await db.select({ count: count() })
      .from(simulationRuns)
      .then(rows => rows[0]?.count || 0);

    if (runCount > this.maxRuns) {
      console.log(`Run count (${runCount}) exceeds limit (${this.maxRuns})`);
      
      // Delete oldest runs
      const runsToDelete = await db.select({ id: simulationRuns.id })
        .from(simulationRuns)
        .orderBy(simulationRuns.createdAt)
        .limit(runCount - this.maxRuns);

      for (const run of runsToDelete) {
        await db.delete(simulationSteps).where(eq(simulationSteps.runId, run.id));
        await db.delete(simulationRuns).where(eq(simulationRuns.id, run.id));
      }

      console.log(`Deleted ${runsToDelete.length} oldest runs to enforce count limit`);
    }
  }

  private async enforceStepsPerRunLimit(): Promise<void> {
    // Get runs with too many steps
    const runsWithTooManySteps = await db.select({ 
      runId: simulationSteps.runId,
      stepCount: count(simulationSteps.id)
    })
    .from(simulationSteps)
    .groupBy(simulationSteps.runId)
    .having(gt(count(simulationSteps.id), this.maxStepsPerRun));

    for (const { runId, stepCount } of runsWithTooManySteps) {
      // Delete oldest steps from this run
      const stepsToDelete = stepCount - this.maxStepsPerRun;
      
      await db.delete(simulationSteps)
        .where(and(
          eq(simulationSteps.runId, runId),
          lt(simulationSteps.id, (
            db.select({ id: simulationSteps.id })
              .from(simulationSteps)
              .where(eq(simulationSteps.runId, runId))
              .orderBy(simulationSteps.timestamp)
              .limit(stepsToDelete)
              .offset(this.maxStepsPerRun)
          ))
        ));

      console.log(`Deleted ${stepsToDelete} oldest steps from run ${runId}`);
    }
  }

  getStorageStats(): { size: number; runs: number; steps: number } {
    const dbPath = path.join(process.cwd(), 'sqlite.db');
    const size = fs.existsSync(dbPath) ? fs.statSync(dbPath).size : 0;
    
    return {
      size,
      runs: 0, // Would need async query
      steps: 0 // Would need async query
    };
  }
}

// Helper functions needed
import { eq, and, lt, gt, count } from 'drizzle-orm';

// Create a singleton instance
export const storageManager = new StorageManager(
  100 * 1024 * 1024, // 100MB
  1000, // 1000 runs
  10000 // 10000 steps per run
);
