import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Play, Pause, RotateCcw } from "lucide-react";

interface ControlPanelProps {
  energy: number;
  setEnergy: (val: number) => void;
  trend: number;
  setTrend: (val: number) => void;
  noise: number;
  setNoise: (val: number) => void;
  isRunning: boolean;
  onToggleRun: () => void;
  onReset: () => void;
}

export function ControlPanel({
  energy,
  setEnergy,
  trend,
  setTrend,
  noise,
  setNoise,
  isRunning,
  onToggleRun,
  onReset
}: ControlPanelProps) {
  return (
    <div className="glass-panel rounded-xl p-6 space-y-8">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold tracking-tight text-primary">Control Parameters</h3>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onReset}
            className="border-border hover:bg-muted"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </Button>
          <Button
            variant={isRunning ? "destructive" : "default"}
            size="sm"
            onClick={onToggleRun}
            className={isRunning ? "bg-red-500/20 text-red-500 hover:bg-red-500/30" : "bg-primary text-primary-foreground hover:bg-primary/90"}
          >
            {isRunning ? (
              <>
                <Pause className="w-4 h-4 mr-2" /> Pause Simulation
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" /> Start Simulation
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        {/* Energy Slider */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <Label className="text-sm font-medium text-muted-foreground">Base Energy Level</Label>
            <span className="font-mono text-sm bg-muted px-2 py-1 rounded">{energy.toFixed(2)}</span>
          </div>
          <Slider
            value={[energy]}
            min={0}
            max={1.5}
            step={0.01}
            onValueChange={(val) => setEnergy(val[0])}
            className="cursor-pointer"
          />
        </div>

        {/* Trend Slider */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <Label className="text-sm font-medium text-muted-foreground">Trend (Bias)</Label>
            <span className="font-mono text-sm bg-muted px-2 py-1 rounded">{trend > 0 ? "+" : ""}{trend.toFixed(2)}</span>
          </div>
          <Slider
            value={[trend]}
            min={-0.5}
            max={0.5}
            step={0.01}
            onValueChange={(val) => setTrend(val[0])}
            className="cursor-pointer"
          />
        </div>

        {/* Noise Slider */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <Label className="text-sm font-medium text-muted-foreground">Noise (Uncertainty)</Label>
            <span className="font-mono text-sm bg-muted px-2 py-1 rounded">{noise.toFixed(2)}</span>
          </div>
          <Slider
            value={[noise]}
            min={0}
            max={1.0}
            step={0.01}
            onValueChange={(val) => setNoise(val[0])}
            className="cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
}
