import { SYSTEM_STATES, type SystemState, type EvaluateRequest, type EvaluateResponse } from "@shared/schema";

// Engine Constants
const THRESHOLDS = {
  STABLE_LIMIT: 0.6,
  BOUNDARY_LIMIT: 0.85,
  HALT_LIMIT: 1.0,
};

// Hysteresis: How much the signal must drop to exit a higher state
const HYSTERESIS_BUFFER = 0.1; 

/**
 * Core Logic for the Limit Behavior Engine
 */
export function evaluateSystemState(input: EvaluateRequest): EvaluateResponse {
  const { energy, trend, noise, previousState } = input;
  
  // 1. Calculate Effective Energy
  //    Effective Energy = Base Energy + (Trend * prediction_factor) + (Noise * random_factor)
  //    For deterministic simulation here, we assume 'noise' input is the MAGNITUDE of potential noise.
  //    We will treat the input 'energy' as the raw sensor reading.
  //    The 'trend' is the rate of change.
  
  // Simple model: project forward slightly based on trend
  const trendImpact = trend * 0.5; // Look ahead 0.5 time units
  
  // Noise impact: We assume the 'noise' input is a +/- range. 
  // For safety-critical limit detection, we often look at the worst-case scenario (upper bound).
  const noiseImpact = Math.abs(noise) * 0.5; 
  
  const effectiveEnergy = energy + trendImpact + noiseImpact;

  // 2. Determine State based on Thresholds & Hysteresis
  let newState: SystemState = SYSTEM_STATES.STABLE;

  if (effectiveEnergy >= THRESHOLDS.HALT_LIMIT) {
    newState = SYSTEM_STATES.SYSTEM_SHOULD_HALT;
  } else if (effectiveEnergy >= THRESHOLDS.BOUNDARY_LIMIT) {
    newState = SYSTEM_STATES.UNSTABLE;
  } else if (effectiveEnergy >= THRESHOLDS.STABLE_LIMIT) {
    newState = SYSTEM_STATES.BOUNDARY_ZONE;
  } else {
    newState = SYSTEM_STATES.STABLE;
  }

  // 3. Apply Hysteresis (Sticky States)
  //    If we were in a worse state, it's harder to go back to a better state.
  if (previousState && previousState !== SYSTEM_STATES.STABLE) {
    // If we were HALTED, we stay HALTED unless explicitly reset (usually handled by app logic, but here we just check values)
    // For this engine, we allow recovery if energy drops significantly.
    
    // Example: To drop from UNSTABLE to BOUNDARY, we need to be strictly below (BOUNDARY_LIMIT - BUFFER)
    if (previousState === SYSTEM_STATES.UNSTABLE) {
      if (newState === SYSTEM_STATES.BOUNDARY_ZONE && effectiveEnergy > (THRESHOLDS.BOUNDARY_LIMIT - HYSTERESIS_BUFFER)) {
        newState = SYSTEM_STATES.UNSTABLE; // Keep it unstable
      }
    }
    
    // Example: To drop from BOUNDARY to STABLE, we need to be strictly below (STABLE_LIMIT - BUFFER)
    if (previousState === SYSTEM_STATES.BOUNDARY_ZONE) {
      if (newState === SYSTEM_STATES.STABLE && effectiveEnergy > (THRESHOLDS.STABLE_LIMIT - HYSTERESIS_BUFFER)) {
        newState = SYSTEM_STATES.BOUNDARY_ZONE; // Keep it boundary
      }
    }
  }

  // 4. Generate Details
  let details = `Energy: ${energy.toFixed(2)} | Eff: ${effectiveEnergy.toFixed(2)}`;
  if (newState === SYSTEM_STATES.SYSTEM_SHOULD_HALT) details += " - CRITICAL LIMIT BREACH";
  else if (newState === SYSTEM_STATES.UNSTABLE) details += " - High Instability Detected";
  else if (newState === SYSTEM_STATES.BOUNDARY_ZONE) details += " - Approaching Limits";
  else details += " - System Nominal";

  return {
    state: newState,
    effectiveEnergy,
    details
  };
}
