import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "wouter";
import { useEvaluateEngine, useCreateRun, useAddSteps } from "@/hooks/use-engine";
import { ControlPanel } from "@/components/ControlPanel";
import { StatusBadge } from "@/components/StatusBadge";
import { SimulationChart } from "@/components/SimulationChart";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { SYSTEM_STATES, type SystemState, type SimulationStep } from "@shared/schema";
import { Activity, Archive, LayoutDashboard, Save } from "lucide-react";

export default function Dashboard() {
  // === Simulation State ===
  const [energy, setEnergy] = useState(0.5);
  const [trend, setTrend] = useState(0.0);
  const [noise, setNoise] = useState(0.1);
  const [isRunning, setIsRunning] = useState(false);
  const [currentState, setCurrentState] = useState<SystemState>(SYSTEM_STATES.STABLE);
  const [history, setHistory] = useState<Partial<SimulationStep>[]>([]);
  const [stepIndex, setStepIndex] = useState(0);
  const [showHaltDialog, setShowHaltDialog] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [runName, setRunName] = useState("");
  const [currentRunId, setCurrentRunId] = useState<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();
  
  // === API Hooks ===
  const evaluate = useEvaluateEngine();
  const createRun = useCreateRun();
  const addSteps = useAddSteps();

  // === Simulation Logic ===
  const tick = useCallback(async () => {
    // 1. Calculate next logical energy step locally for smoothing
    // This simulates the physical system "drifting" before we evaluate it
    const drift = trend * 0.05; // small time step factor
    const randomNoise = (Math.random() - 0.5) * noise * 0.2;
    
    // Update local slider visual (optional - might be too jittery)
    // For now we just use the slider value as the "Base Energy"
    
    try {
      // 2. Evaluate against the engine
      let result;
      if (!currentRunId) {
        // Start new run
        result = await evaluate.mutateAsync({
          command: 'start_new',
          name: runName || `Run ${new Date().toLocaleTimeString()}`,
          description: `Max Energy: ${energy}, Trend: ${trend}, Noise: ${noise}`,
          maxEnergy: 1.5,
          boundaryThreshold: 0.8,
          haltThreshold: 1.0,
          energy,
          trend,
          noise,
          previousState: currentState
        });
        
        if (result.runId) {
          setCurrentRunId(result.runId);
          setHistory([{
            stepIndex: 0,
            timestamp: Date.now(),
            energy: result.effectiveEnergy,
            trend,
            noise,
            calculatedState: result.state
          }]);
        }
      } else {
        // Add step to existing run
        result = await evaluate.mutateAsync({
          command: 'evaluate',
          runId: currentRunId!,
          stepIndex: stepIndex + 1,
          timestamp: Date.now(),
          energy,
          trend,
          noise,
          previousState: currentState
        });
      }

      // 3. Update State
      setCurrentState(result.state);
      
      const newStep: Partial<SimulationStep> = {
        stepIndex: stepIndex + 1,
        timestamp: Date.now(),
        energy: result.effectiveEnergy,
        trend,
        noise,
        calculatedState: result.state,
      };

      setHistory(prev => {
        const newHistory = [...prev, newStep];
        return newHistory.slice(-100); // Keep last 100 points for live chart performance
      });
      setStepIndex(prev => prev + 1);

      // 4. Halt Condition
      if (result.state === SYSTEM_STATES.SYSTEM_SHOULD_HALT) {
        setIsRunning(false);
        setShowHaltDialog(true);
        if (timerRef.current) clearInterval(timerRef.current);
      }

    } catch (error) {
      console.error("Simulation error:", error);
      setIsRunning(false);
    }
  }, [energy, trend, noise, currentState, stepIndex, evaluate]);

  // === Effect Loop ===
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(tick, 200); // 5Hz update rate
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, tick]);

  // === Handlers ===
  const handleReset = () => {
    setIsRunning(false);
    setHistory([]);
    setStepIndex(0);
    setCurrentState(SYSTEM_STATES.STABLE);
    setEnergy(0.5);
    setTrend(0.0);
    setNoise(0.1);
  };

  const handleSaveRun = async () => {
    try {
      // Validate run exists
      if (!currentRunId) {
        toast({
          variant: "destructive",
          title: "No Simulation",
          description: "Run a simulation first before saving.",
        });
        return;
      }

      const finalName = runName.trim() || `Simulation ${new Date().toLocaleTimeString()}`;
      
      // Update the run name in database
      const updateRes = await fetch(`/api/runs/${currentRunId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: finalName })
      });

      if (!updateRes.ok) {
        const error = await updateRes.json();
        throw new Error(error.message || 'Failed to save run');
      }

      // Show success
      toast({
        title: "Saved Successfully",
        description: `Simulation "${finalName}" saved with ${history.length} steps.`,
      });

      // Clean up and reset
      setShowSaveDialog(false);
      setRunName("");
      handleReset();
      
    } catch (error) {
      console.error('Save error:', error);
      toast({
        variant: "destructive",
        title: "Save Failed",
        description: error instanceof Error ? error.message : "Could not save simulation.",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Sidebar Navigation */}
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
          <Button variant="ghost" className="w-full justify-start bg-primary/10 text-primary hover:bg-primary/20" asChild>
            <Link href="/">
              <LayoutDashboard className="w-4 h-4 mr-3" />
              Live Simulation
            </Link>
          </Button>
          <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-foreground hover:bg-muted" asChild>
            <Link href="/history">
              <Archive className="w-4 h-4 mr-3" />
              Run History
            </Link>
          </Button>
        </nav>

        <div className="mt-auto pt-4 border-t border-border">
           <div className="text-xs text-muted-foreground">
             <p className="font-semibold text-foreground mb-1">System Status</p>
             <div className="flex items-center gap-2">
               <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
               Connected
             </div>
           </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto space-y-8">
          
          {/* Top Bar */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Limit Behavior Engine</h2>
              <p className="text-muted-foreground">Real-time boundary detection and halt logic simulation.</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowSaveDialog(true)} disabled={history.length === 0}>
                <Save className="w-4 h-4 mr-2" />
                Save Run
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Col: Controls */}
            <div className="lg:col-span-1 space-y-6">
              <ControlPanel 
                energy={energy} setEnergy={setEnergy}
                trend={trend} setTrend={setTrend}
                noise={noise} setNoise={setNoise}
                isRunning={isRunning}
                onToggleRun={() => setIsRunning(!isRunning)}
                onReset={handleReset}
              />

              {/* Status Monitor Card */}
              <Card className="p-6 border-border bg-card/50 backdrop-blur">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">System Monitor</h3>
                <div className="flex flex-col items-center justify-center space-y-4 py-4">
                   <StatusBadge status={currentState} large />
                   <div className="text-center">
                     <span className="text-4xl font-mono font-bold text-foreground">
                       {history.length > 0 ? history[history.length - 1].energy?.toFixed(3) : "0.000"}
                     </span>
                     <p className="text-xs text-muted-foreground mt-1">EFFECTIVE ENERGY</p>
                   </div>
                </div>
              </Card>
            </div>

            {/* Right Col: Chart */}
            <div className="lg:col-span-2">
              <Card className="h-full min-h-[500px] p-6 border-border flex flex-col">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold">Energy Timeline</h3>
                  <div className="flex gap-4 text-xs font-mono text-muted-foreground">
                    <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500"/> STABLE</span>
                    <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-yellow-500"/> BOUNDARY</span>
                    <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-orange-500"/> UNSTABLE</span>
                  </div>
                </div>
                <div className="flex-1 w-full">
                  <SimulationChart data={history} height={400} />
                </div>
              </Card>
            </div>
          </div>
        </div>
      </main>

      {/* Halt Alert Dialog */}
      <Dialog open={showHaltDialog} onOpenChange={setShowHaltDialog}>
        <DialogContent className="border-red-500/50 bg-background sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-500">
              <Activity className="w-6 h-6" /> SYSTEM HALT TRIGGERED
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-foreground">
              Critical instability detected. The safety interlock has halted the simulation to prevent system damage.
            </p>
            <div className="mt-4 p-3 bg-red-950/20 border border-red-900/50 rounded-md font-mono text-sm text-red-200">
              ERR_CRITICAL_LIMIT_EXCEEDED
              <br/>
              Energy Level: {history.length > 0 ? history[history.length - 1].energy?.toFixed(4) : "N/A"}
            </div>
          </div>
          <DialogFooter>
            <Button variant="destructive" onClick={() => setShowHaltDialog(false)}>
              Acknowledge Halt
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Save Run Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Simulation Run</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="runName">Run Name</Label>
              <Input 
                id="runName" 
                placeholder="e.g. Stress Test Alpha" 
                value={runName} 
                onChange={(e) => setRunName(e.target.value)} 
              />
            </div>
            <p className="text-sm text-muted-foreground">
              This will archive {history.length} time steps for future analysis.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveDialog(false)}>Cancel</Button>
            <Button 
              onClick={handleSaveRun} 
              disabled={!runName.trim() || createRun.isPending}
            >
              {createRun.isPending ? "Saving..." : "Save Run"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
