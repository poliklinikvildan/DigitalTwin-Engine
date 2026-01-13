import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceArea } from 'recharts';
import { type SimulationStep } from "@shared/schema";
import { useMemo } from 'react';

interface SimulationChartProps {
  data: Partial<SimulationStep>[];
  height?: number;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border p-3 rounded-md shadow-xl text-xs font-mono z-50">
        <p className="text-muted-foreground mb-1">Step: {label}</p>
        <p className="text-primary font-bold">Energy: {payload[0].value.toFixed(3)}</p>
        <p className="text-muted-foreground">State: {payload[0].payload.calculatedState}</p>
      </div>
    );
  }
  return null;
};

export function SimulationChart({ data, height = 300 }: SimulationChartProps) {
  // We want to show a moving window or full history
  // For performance, maybe slice the last 100 points if live
  const chartData = useMemo(() => {
    return data;
  }, [data]);

  return (
    <div style={{ height }} className="w-full relative rounded-xl overflow-hidden border border-border bg-card/30">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
          
          {/* Background Zones - approximate visual guides */}
          <ReferenceArea y1={0} y2={0.8} fill="rgba(16, 185, 129, 0.05)" /> {/* Stable zone */}
          <ReferenceArea y1={0.8} y2={1.0} fill="rgba(234, 179, 8, 0.05)" /> {/* Boundary zone */}
          <ReferenceArea y1={1.0} y2={1.5} fill="rgba(249, 115, 22, 0.05)" /> {/* Unstable zone */}
          
          <XAxis 
            dataKey="stepIndex" 
            stroke="#64748b" 
            tick={{ fontSize: 10, fontFamily: 'JetBrains Mono' }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis 
            domain={[0, 1.5]} 
            stroke="#64748b" 
            tick={{ fontSize: 10, fontFamily: 'JetBrains Mono' }}
            tickLine={false}
            axisLine={false}
            width={40}
          />
          
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.2)', strokeWidth: 1 }} />
          
          <Line 
            type="monotone" 
            dataKey="energy" 
            stroke="hsl(210 100% 50%)" 
            strokeWidth={2} 
            dot={false}
            isAnimationActive={false} // Disable animation for smoother live updates
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
