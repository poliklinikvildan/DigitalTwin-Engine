import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { db } from "./db";
import { eq, and, lt, gt, count, desc } from "drizzle-orm";
import {
  simulationRuns,
  simulationSteps,
  type SimulationRun,
  type CreateRunRequest,
  type SimulationStep,
  type CreateStepRequest,
  insertRunSchema,
  insertStepSchema,
} from "@shared/schema";
import { storageManager } from "./storage-manager";
import { evaluateSystemState } from "./lib/engine";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // === Engine Routes ===
  
  app.post(api.engine.evaluate.path, async (req, res) => {
    try {
      const input = api.engine.evaluate.input.parse(req.body);
      const result = evaluateSystemState(input);
      
      // Handle control commands
      if (input.command === 'start_new') {
        // Create a new run
        const newRun = await storage.createRun({
          name: input.name || `Run ${Date.now()}`,
          description: input.description || "New simulation run",
          configuration: {
            maxEnergy: input.maxEnergy || 1.5,
            boundaryThreshold: input.boundaryThreshold || 0.8,
            haltThreshold: input.haltThreshold || 1.0
          }
        });
        
        // Save initial step
        await storage.addSteps([{
          runId: newRun.id,
          stepIndex: 0,
          timestamp: Date.now(),
          energy: input.energy,
          trend: input.trend,
          noise: input.noise,
          calculatedState: result.state
        }]);
        
        return res.json({
          ...result,
          runId: newRun.id,
          action: 'started_new'
        });
      }
      
      // Auto-save step if runId is provided
      if (input.runId) {
        await storage.addSteps([{
          runId: input.runId,
          stepIndex: input.stepIndex || 0,
          timestamp: input.timestamp || Date.now(),
          energy: input.energy,
          trend: input.trend,
          noise: input.noise,
          calculatedState: result.state
        }]);
      }
      
      res.json(result);
    } catch (err: any) {
      console.error('Evaluate error:', err);
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      res.status(500).json({ 
        error: err.message || 'Evaluation failed',
        details: err.toString()
      });
    }
  });

  // === Simulation Run Routes ===

  app.get(api.runs.list.path, async (req, res) => {
    const runs = await storage.getRuns();
    res.json(runs);
  });

  app.post(api.runs.create.path, async (req, res) => {
    try {
      const input = api.runs.create.input.parse(req.body);
      const run = await storage.createRun(input);
      
      // Enforce storage limits after creating a new run
      await storageManager.enforceLimits();
      
      res.status(201).json(run);
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.get(api.runs.get.path, async (req, res) => {
    const id = Number(req.params.id);
    const run = await storage.getRun(id);
    if (!run) {
      return res.status(404).json({ message: 'Run not found' });
    }
    const steps = await storage.getRunSteps(id);
    res.json({ run, steps });
  });

  app.post(api.runs.addSteps.path, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const run = await storage.getRun(id);
      if (!run) {
        return res.status(404).json({ message: 'Run not found' });
      }

      const bodySchema = z.object({
        steps: z.array(insertStepSchema.omit({ runId: true }))
      });
      
      const input = bodySchema.parse(req.body);
      
      // Map input steps to include runId
      const stepsToInsert = input.steps.map(s => ({
        ...s,
        runId: id
      }));

      await storage.addSteps(stepsToInsert);
      res.status(201).json({ count: stepsToInsert.length });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  // Update run metadata (name, description)
  app.patch(api.runs.update.path, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const run = await storage.getRun(id);
      if (!run) {
        return res.status(404).json({ message: 'Run not found' });
      }

      const input = api.runs.update.input.parse(req.body);
      
      // Update only the provided fields
      const updateData: any = {};
      if (input.name !== undefined) updateData.name = input.name;
      if (input.description !== undefined) updateData.description = input.description;

      const [updatedRun] = await db
        .update(simulationRuns)
        .set(updateData)
        .where(eq(simulationRuns.id, id))
        .returning();

      res.json(updatedRun);
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  // === Debug Routes ===
  
  app.get('/api/debug/runs', async (req, res) => {
    try {
      const runs = await db.select().from(simulationRuns);
      const steps = await db.select().from(simulationSteps);
      res.json({
        runsCount: runs.length,
        stepsCount: steps.length,
        runs: runs,
        steps: steps.slice(0, 5), // Show first 5 steps
        dbPath: process.env.DATABASE_URL
      });
    } catch (err: any) {
      console.error('Debug error:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // === Memory Management Routes ===
  
  app.get('/api/memory/stats', async (req, res) => {
    try {
      const stats = await memoryLimit.getDetailedStats();
      res.json({
        currentSize: stats.currentSize,
        maxSize: stats.maxSize,
        usagePercent: stats.usagePercent,
        runCount: stats.runCount,
        stepCount: stats.stepCount,
        currentSizeMB: (stats.currentSize / 1024 / 1024).toFixed(2),
        maxSizeMB: (stats.maxSize / 1024 / 1024).toFixed(2),
      });
    } catch (err: any) {
      console.error('Error getting memory stats:', err);
      res.status(500).json({ error: err.message || 'Failed to get memory stats' });
    }
  });

  app.post('/api/memory/cleanup', async (req, res) => {
    try {
      await memoryLimit.enforceMemoryLimit();
      const stats = await memoryLimit.getDetailedStats();
      res.json({
        message: 'Memory cleanup completed',
        stats: {
          currentSizeMB: (stats.currentSize / 1024 / 1024).toFixed(2),
          maxSizeMB: (stats.maxSize / 1024 / 1024).toFixed(2),
          usagePercent: stats.usagePercent.toFixed(2),
          runCount: stats.runCount,
          stepCount: stats.stepCount,
        }
      });
    } catch (err: any) {
      console.error('Error during memory cleanup:', err);
      res.status(500).json({ error: err.message || 'Failed to cleanup memory' });
    }
  });

  return httpServer;
}

// Seed function to create initial demo data
export async function seedDatabase() {
  const existingRuns = await storage.getRuns();
  if (existingRuns.length === 0) {
    console.log("Seeding database with demo run...");
    const run = await storage.createRun({
      name: "Demo Calibration Run",
      description: "Initial system calibration test",
      configuration: {
        maxEnergy: 1.5,
        boundaryThreshold: 0.8,
        haltThreshold: 1.0
      }
    });

    // Add some steps
    const steps = [];
    for (let i = 0; i < 20; i++) {
      const time = i * 0.5;
      const energy = 0.2 + (i * 0.05); // Increasing energy
      const result = evaluateSystemState({
        energy,
        trend: 0.1,
        noise: 0.05,
        previousState: "STABLE"
      });
      
      steps.push({
        runId: run.id,
        stepIndex: i,
        timestamp: time,
        energy,
        trend: 0.1,
        noise: 0.05,
        calculatedState: result.state
      });
    }
    await storage.addSteps(steps);
    console.log("Seeding complete.");
  }
}
