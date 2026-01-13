import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { evaluateSystemState } from "./lib/engine";
import { insertStepSchema } from "@shared/schema";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // === Engine Routes ===
  
  app.post(api.engine.evaluate.path, (req, res) => {
    try {
      const input = api.engine.evaluate.input.parse(req.body);
      const result = evaluateSystemState(input);
      res.json(result);
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

  // === Simulation Run Routes ===

  app.get(api.runs.list.path, async (req, res) => {
    const runs = await storage.getRuns();
    res.json(runs);
  });

  app.post(api.runs.create.path, async (req, res) => {
    try {
      const input = api.runs.create.input.parse(req.body);
      const run = await storage.createRun(input);
      res.status(201).json(run);
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
