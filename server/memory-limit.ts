import { db } from './db';
import { simulationRuns, simulationSteps } from '@shared/schema';
import { eq, desc } from 'drizzle-orm';

export class MemoryLimit {
  private readonly maxDbSizeBytes: number;

  constructor(maxDbSizeBytes: number = 200 * 1024) { // Default 200KB
    this.maxDbSizeBytes = maxDbSizeBytes;
  }

  async enforceMemoryLimit(): Promise<void> {
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

    // Check if the single run exceeds size limit
    const newSize = fs.statSync(this.dbPath).size;
    if (newSize > this.maxDbSizeBytes && runs.length > 0) {
      const latestRun = runs[0];
      
      // Get all steps for this run, ordered by timestamp
      const steps = await db
        .select({
          id: simulationSteps.id,
          timestamp: simulationSteps.timestamp,
        })
        .from(simulationSteps)
        .where(eq(simulationSteps.runId, latestRun.id))
        .orderBy(simulationSteps.timestamp);

      // Delete steps from the end until under size limit
      let deletedSteps = 0;
      for (let i = steps.length - 1; i >= 0; i--) {
        await db
          .delete(simulationSteps)
          .where(eq(simulationSteps.id, steps[i].id));
        
        deletedSteps++;
        
        // Check size after each deletion
        const currentSizeAfterDelete = fs.statSync(this.dbPath).size;
        if (currentSizeAfterDelete <= this.maxDbSizeBytes) {
          break;
        }
      }
      
      console.log(`Truncated run "${latestRun.name}" - deleted ${deletedSteps} steps to stay within 200KB limit`);
    }
  }

  getMemoryStats(): {
    currentSize: number;
    maxSize: number;
    usagePercent: number;
    runCount: number;
    stepCount: number;
  } {
    const currentSize = fs.existsSync(this.dbPath) ? fs.statSync(this.dbPath).size : 0;
    
    return {
      currentSize,
      maxSize: this.maxDbSizeBytes,
      usagePercent: (currentSize / this.maxDbSizeBytes) * 100,
      runCount: 0, // Would need async query
      stepCount: 0, // Would need async query
    };
  }

  async getDetailedStats(): Promise<{
    currentSize: number;
    maxSize: number;
    usagePercent: number;
    runCount: number;
    stepCount: number;
  }> {
    const currentSize = fs.existsSync(this.dbPath) ? fs.statSync(this.dbPath).size : 0;
    
    const [runCount, stepCount] = await Promise.all([
      db.select({ count: simulationRuns.id }).from(simulationRuns).then(rows => rows.length),
      db.select({ count: simulationSteps.id }).from(simulationSteps).then(rows => rows.length)
    ]);

    return {
      currentSize,
      maxSize: this.maxDbSizeBytes,
      usagePercent: (currentSize / this.maxDbSizeBytes) * 100,
      runCount,
      stepCount,
    };
  }
}

// Create instance with 200KB limit
export const memoryLimit = new MemoryLimit(200 * 1024); // 200KB
