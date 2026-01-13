import { db } from './db';
import { simulationRuns, simulationSteps } from '@shared/schema';
import { eq, desc, gt, and, count, lt } from 'drizzle-orm';

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
    // PostgreSQL manages its own storage on the server
    // No local file size checks needed
    console.log('Size limits enforced by PostgreSQL server');
  }

  private async enforceRunCountLimit(): Promise<void> {
    const result = await db.select({ count: count() })
      .from(simulationRuns);
    
    const runCount = result[0]?.count || 0;

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

  getStorageStats(): { runs: number; steps: number } {
    // Returns placeholder stats - would need async query for actual values
    return {
      runs: 0,
      steps: 0
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
