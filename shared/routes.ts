import { z } from 'zod';
import { insertRunSchema, insertStepSchema, evaluateRequestSchema, simulationRuns, simulationSteps, SYSTEM_STATES } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  engine: {
    evaluate: {
      method: 'POST' as const,
      path: '/api/engine/evaluate',
      input: evaluateRequestSchema,
      responses: {
        200: z.object({
          state: z.nativeEnum(SYSTEM_STATES),
          effectiveEnergy: z.number(),
          details: z.string()
        }),
        400: errorSchemas.validation,
      },
    },
  },
  runs: {
    list: {
      method: 'GET' as const,
      path: '/api/runs',
      responses: {
        200: z.array(z.custom<typeof simulationRuns.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/runs',
      input: insertRunSchema,
      responses: {
        201: z.custom<typeof simulationRuns.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/runs/:id',
      responses: {
        200: z.object({
          run: z.custom<typeof simulationRuns.$inferSelect>(),
          steps: z.array(z.custom<typeof simulationSteps.$inferSelect>())
        }),
        404: errorSchemas.notFound,
      },
    },
    addSteps: {
      method: 'POST' as const,
      path: '/api/runs/:id/steps',
      input: z.object({
        steps: z.array(insertStepSchema.omit({ runId: true }))
      }),
      responses: {
        201: z.object({ count: z.number() }),
        404: errorSchemas.notFound,
      },
    }
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
