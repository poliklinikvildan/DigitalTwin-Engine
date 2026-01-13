import { Link } from "wouter";
import { useRuns, useRun } from "@/hooks/use-engine";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Activity, LayoutDashboard, Calendar, FileText, ChevronRight } from "lucide-react";
import { SimulationChart } from "@/components/SimulationChart";
import { useState } from "react";
import { format } from "date-fns";

export default function History() {
  const { data: runs, isLoading } = useRuns();
  const [selectedRunId, setSelectedRunId] = useState<number | null>(null);

  // Fetch details only when a run is selected
  const { data: runDetails, isLoading: isLoadingDetails } = useRun(selectedRunId || 0);

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Sidebar Navigation (Reusable ideally) */}
      <aside className="w-full md:w-64 bg-card border-r border-border flex flex-col p-4 space-y-4">
        <div className="flex items-center gap-2 px-2 py-4 mb-4">
          <div className="w-8 h-8 rounded bg-primary flex items-center justify-center">
            <Activity className="text-primary-foreground w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-foreground leading-none">LBSE</h1>
            <p className="text-xs text-muted-foreground font-mono">v1.0.0-RC</p>
          </div>
        </div>
        
        <nav className="space-y-1 flex-1">
          <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-foreground hover:bg-muted" asChild>
            <Link href="/">
              <LayoutDashboard className="w-4 h-4 mr-3" />
              Live Simulation
            </Link>
          </Button>
          <Button variant="ghost" className="w-full justify-start bg-primary/10 text-primary hover:bg-primary/20" asChild>
            <Link href="/history">
              <FileText className="w-4 h-4 mr-3" />
              Run History
            </Link>
          </Button>
        </nav>
      </aside>

      <main className="flex-1 p-4 md:p-8 h-screen overflow-hidden flex flex-col">
        <div className="mb-6">
          <h2 className="text-2xl font-bold tracking-tight">Run History</h2>
          <p className="text-muted-foreground">Analyze past simulation scenarios and outcomes.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full min-h-0">
          {/* List of Runs */}
          <Card className="lg:col-span-1 border-border flex flex-col min-h-0 bg-card/50">
            <div className="p-4 border-b border-border">
              <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Saved Runs</h3>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-2 space-y-1">
                {isLoading ? (
                  <div className="p-4 text-sm text-muted-foreground">Loading runs...</div>
                ) : runs?.length === 0 ? (
                  <div className="p-4 text-sm text-muted-foreground">No runs saved yet.</div>
                ) : (
                  runs?.map((run) => (
                    <button
                      key={run.id}
                      onClick={() => setSelectedRunId(run.id)}
                      className={`w-full text-left px-4 py-3 rounded-lg text-sm transition-all border ${
                        selectedRunId === run.id 
                          ? "bg-primary/10 border-primary/50 text-foreground shadow-sm" 
                          : "hover:bg-muted border-transparent text-muted-foreground"
                      }`}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-semibold truncate">{run.name}</span>
                        <ChevronRight className={`w-3 h-3 ${selectedRunId === run.id ? "opacity-100" : "opacity-0"}`} />
                      </div>
                      <div className="flex items-center gap-2 text-xs opacity-70">
                        <Calendar className="w-3 h-3" />
                        {run.createdAt ? format(new Date(run.createdAt), "MMM d, HH:mm") : "Unknown"}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </ScrollArea>
          </Card>

          {/* Details View */}
          <Card className="lg:col-span-2 border-border flex flex-col min-h-0 bg-card overflow-hidden">
            {selectedRunId ? (
              isLoadingDetails ? (
                <div className="flex items-center justify-center h-full text-muted-foreground">Loading details...</div>
              ) : runDetails ? (
                <div className="flex flex-col h-full">
                  <div className="p-6 border-b border-border bg-card/50">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-xl font-bold text-foreground">{runDetails.run.name}</h3>
                        <p className="text-sm text-muted-foreground mt-1">{runDetails.run.description}</p>
                      </div>
                      <div className="text-right text-xs font-mono text-muted-foreground">
                        ID: {runDetails.run.id}<br/>
                        STEPS: {runDetails.steps.length}
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-6 flex-1 min-h-0 flex flex-col">
                    <h4 className="text-sm font-semibold mb-4">Playback Analysis</h4>
                    <div className="flex-1 w-full min-h-0">
                      <SimulationChart data={runDetails.steps} height={400} />
                    </div>
                  </div>
                </div>
              ) : (
                 <div className="flex items-center justify-center h-full text-muted-foreground">Run not found.</div>
              )
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-8 text-center">
                <FileText className="w-12 h-12 mb-4 opacity-20" />
                <p>Select a run from the sidebar to view details.</p>
              </div>
            )}
          </Card>
        </div>
      </main>
    </div>
  );
}
