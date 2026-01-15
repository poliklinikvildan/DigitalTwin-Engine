# Digital Twin Engine - State Transition Logic

## Core Behavior
The engine's state changes are controlled by energy levels with built-in stability logic to prevent rapid toggling between states.

## State Thresholds
```typescript
// State transition points
const THRESHOLDS = {
  // Entering states (rising energy)
  RISE: {
    BOUNDARY: 0.6,   // STABLE → BOUNDARY_ZONE
    UNSTABLE: 0.85,  // BOUNDARY_ZONE → UNSTABLE
    HALT: 1.0        // UNSTABLE → SYSTEM_SHOULD_HALT
  },
  // Exiting states (falling energy)
  FALL: {
    UNSTABLE: 0.75,  // UNSTABLE → BOUNDARY_ZONE (0.85 - 0.1)
    BOUNDARY: 0.5,   // BOUNDARY_ZONE → STABLE (0.6 - 0.1)
  }
};
```

## Key Concepts
1. **Energy Calculation**
   ```typescript
   effectiveEnergy = energy + (trend * 0.5) + (Math.abs(noise) * 0.5)
   ```

2. **State Determination**
   - `STABLE`: energy < 0.6
   - `BOUNDARY_ZONE`: 0.6 ≤ energy < 0.85
   - `UNSTABLE`: 0.85 ≤ energy < 1.0
   - `SYSTEM_SHOULD_HALT`: energy ≥ 1.0

3. **Stability Mechanism**
   - Entering a higher state: Use RISE thresholds
   - Exiting a state: Must drop below FALL thresholds
   - Prevents rapid state changes near threshold boundaries

## Example Flow
1. Energy rises to 0.62 → Enters BOUNDARY_ZONE
2. Energy rises to 0.9 → Enters UNSTABLE
3. Energy drops to 0.8 → Stays UNSTABLE (above 0.75)
4. Energy drops to 0.7 → Returns to BOUNDARY_ZONE
5. Energy drops to 0.55 → Stays BOUNDARY_ZONE (above 0.5)
6. Energy drops to 0.4 → Returns to STABLE

For detailed chart visualization information, see [CHART_VISUALIZATION.md](./CHART_VISUALIZATION.md).

Note: This is a general system, thus no units are applied except time (milliseconds). The simulation updates every 200ms (5Hz). The 5Hz comes from the calculation: 1000ms ÷ 200ms = 5 updates per second = 5Hz.




