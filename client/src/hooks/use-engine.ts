import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type EvaluateRequest, type CreateRunRequest, type CreateStepRequest } from "@shared/routes";

// Hook for the core engine evaluation (stateless)
export function useEvaluateEngine() {
  return useMutation({
    mutationFn: async (data: EvaluateRequest) => {
      const res = await fetch(api.engine.evaluate.path, {
        method: api.engine.evaluate.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Engine evaluation failed");
      return api.engine.evaluate.responses[200].parse(await res.json());
    },
  });
}

// Hook to save a full simulation run metadata
export function useCreateRun() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateRunRequest) => {
      const res = await fetch(api.runs.create.path, {
        method: api.runs.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create run");
      return api.runs.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.runs.list.path] });
    },
  });
}

// Hook to bulk save steps for a run
export function useAddSteps(runId: number) {
  return useMutation({
    mutationFn: async (steps: Omit<CreateStepRequest, "runId">[]) => {
      const url = buildUrl(api.runs.addSteps.path, { id: runId });
      const res = await fetch(url, {
        method: api.runs.addSteps.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ steps }),
      });
      if (!res.ok) throw new Error("Failed to save steps");
      return api.runs.addSteps.responses[201].parse(await res.json());
    },
  });
}

// Hook to list all historical runs
export function useRuns() {
  return useQuery({
    queryKey: [api.runs.list.path],
    queryFn: async () => {
      const res = await fetch(api.runs.list.path);
      if (!res.ok) throw new Error("Failed to fetch runs");
      return api.runs.list.responses[200].parse(await res.json());
    },
  });
}

// Hook to get a specific run with its steps
export function useRun(id: number) {
  return useQuery({
    queryKey: [api.runs.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.runs.get.path, { id });
      const res = await fetch(url);
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch run details");
      return api.runs.get.responses[200].parse(await res.json());
    },
    enabled: !!id,
  });
}
