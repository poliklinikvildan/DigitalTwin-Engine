# Chart Visualization - Energy Timeline

## Overview
The Digital Twin Engine features a real-time energy chart that visualizes system behavior over time, providing immediate visual feedback on energy levels and state transitions.

## User Interface Features

### Interactive Controls
- **Energy Slider**: Adjust current energy level (0-1.5)
- **Trend Slider**: Control rate of change (-1 to 1)
- **Uncertainty Slider**: Set noise/randomness factor (0-0.2)
- **Run/Pause/Reset Buttons**: Control simulation state

### State Indicators (System Monitor Badge)
- **Green**: STABLE - System operating within normal parameters
- **Yellow**: BOUNDARY - System approaching critical limits
- **Orange**: UNSTABLE - System exhibiting unstable behavior
- **Red**: HALT - Critical instability detected, shutdown initiated

### Timeline Visualization
- **Real-time Updates**: Every 200ms
- **Energy vs Time Chart**: Shows energy progression
- **Boundary Bands**: Visual threshold indicators
- **State Transitions**: Immediate visual feedback when crossing zones

## Control Panel Implementation

### Slider Controls
```typescript
// Energy Control
<Slider
  value={energy}
  onChange={setEnergy}
  min={0}
  max={1.5}
  step={0.01}
/>

// Trend Control
<Slider
  value={trend}
  onChange={setTrend}
  min={-1}
  max={1}
  step={0.01}
/>

// Uncertainty Control
<Slider
  value={noise}
  onChange={setNoise}
  min={0}
  max={0.2}
  step={0.01}
/>
```

### Simulation Controls
- **Run Button**: Starts simulation loop
- **Pause Button**: Stops updates while maintaining state
- **Reset Button**: Clears history and returns to initial state

## User Interaction Patterns

### Typical Workflow
1. **Initial Setup**: Adjust energy, trend, and uncertainty sliders
2. **Start Simulation**: Click Run to begin real-time updates
3. **Monitor Progress**: Watch chart and state indicators
4. **Adjust Parameters**: Modify sliders during simulation
5. **Pause Analysis**: Stop to examine specific points
6. **Reset**: Clear data for new simulation run

### Visual Feedback Loop
- **Slider Change** → **Energy Calculation** → **State Update** → **Chart Update**
- **State Change** → **Color Indicator** → **Alert Dialog** (if HALT)
- **Chart Update** → **New Data Point** → **Line Extension**

## Chart Components

### X-Axis: Time Progression
- **Data Key**: `stepIndex`
- **Representation**: Each step = 200ms interval
- **Scale**: Sequential steps showing simulation progression
- **Update Rate**: 5Hz (5 updates per second)

### Y-Axis: Energy Levels
- **Range**: 0 to 1.5
- **Unit**: General energy value (no specific units)
- **Precision**: Displays up to 3 decimal places

## Visual Zones

### Green Zone (0 - 0.8)
- **Label**: Stable
- **Meaning**: System operating within normal parameters
- **Color**: `rgba(16, 185, 129, 0.05)` (subtle green)

### Yellow Zone (0.8 - 1.0)
- **Label**: Boundary
- **Meaning**: System approaching critical limits
- **Color**: `rgba(234, 179, 8, 0.05)` (subtle yellow)

### Orange Zone (1.0 - 1.5)
- **Label**: Unstable
- **Meaning**: System exhibiting unstable behavior
- **Color**: `rgba(249, 115, 22, 0.05)` (subtle orange)

## Chart Features

### Line Display
- **Type**: Monotone (smooth curve)
- **Color**: Blue (`hsl(210 100% 50%)`)
- **Width**: 2px
- **Points**: No dots (continuous line)
- **Animation**: Disabled for smooth live updates

### Interactive Elements
- **Tooltip**: Shows on hover
  - Step number
  - Energy value (3 decimal places)
  - Current system state
- **Cursor**: Crosshair with subtle white stroke

### Performance Optimization
- **Data Points**: Keeps last 100 points for live view
- **Update Method**: Efficient array slicing
- **Render**: No animations to reduce CPU load

## Technical Implementation

### Data Structure
```typescript
interface SimulationStep {
  stepIndex: number;     // X-axis value
  energy: number;        // Y-axis value
  calculatedState: string; // State for tooltip
  timestamp: number;     // Internal timestamp
}
```

### Chart Library
- **Framework**: React + Recharts
- **Component**: Custom React component (SimulationChart)
- **Library**: Recharts for React
- **Grid**: Subtle dashed lines (horizontal only)
- **Typography**: JetBrains Mono font for consistency

## Usage in Application

### Dashboard View
- **Real-time Updates**: Every 200ms
- **Height**: 400px
- **Title**: "Energy Timeline"
- **Legend**: Color-coded state indicators

### History View
- **Full History**: All simulation steps
- **Height**: 400px
- **Purpose**: Post-simulation analysis
- **Context**: Part of playback analysis

## Visual Feedback

### State Transitions
- **Immediate**: Line crosses zone boundaries
- **Clear**: Color zones provide instant context
- **Accurate**: Reflects actual state logic thresholds

### Performance Monitoring
- **Smooth**: No flickering during updates
- **Responsive**: Adapts to container size
- **Efficient**: Minimal DOM manipulation

## Integration with State Logic

The chart directly reflects the state transition logic:
- **Thresholds**: Match engine thresholds (0.6, 0.85, 1.0)
- **Zones**: Visual representation of state boundaries
- **Real-time**: Synchronized with simulation engine

This visualization provides users with immediate understanding of system behavior, energy trends, and state transitions without needing to interpret raw numbers.
