// Copied from CimPro BugBaas-3.0/src/services/gameLoopTiming.ts (SHA256
// f63fbdcbc382566c5722f9783e6a0f7b3775a75df2a3b7f0059b8f5cd5b3677d).
const defaultFrameMs = 1000 / 60;
const maxCatchUpMs = 48;
const gameplaySpeed = 1.2;

export function frameScaleForTick(now: number, previousFrameAt: number, simulationStepMs: number): number {
  const rawDelta = previousFrameAt > 0 ? now - previousFrameAt : defaultFrameMs;
  const safeDelta = Math.min(maxCatchUpMs, Math.max(8, Number.isFinite(rawDelta) ? rawDelta : defaultFrameMs));
  return (safeDelta / Math.max(1, simulationStepMs)) * gameplaySpeed;
}

/** A nonzero synthetic origin preserves the original first-frame dt during replay. */
export const originalFrameScale = (elapsedMs:number,dt:number,simulationStepMs:number) =>
  frameScaleForTick(1000+elapsedMs,1000+elapsedMs-dt,simulationStepMs);
