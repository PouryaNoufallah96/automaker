import { useState, useCallback, useMemo } from 'react';
import { useAppStore } from '@/store/app-store';
import type { ModelAlias, CursorModelId, PhaseModelKey } from '@automaker/types';

export interface UseModelOverrideOptions {
  /** Which phase this override is for */
  phase: PhaseModelKey;
  /** Initial override value (optional) */
  initialOverride?: ModelAlias | CursorModelId | null;
}

export interface UseModelOverrideResult {
  /** The effective model (override or global default) */
  effectiveModel: ModelAlias | CursorModelId;
  /** Whether the model is currently overridden */
  isOverridden: boolean;
  /** Set a model override */
  setOverride: (model: ModelAlias | CursorModelId | null) => void;
  /** Clear the override and use global default */
  clearOverride: () => void;
  /** The global default for this phase */
  globalDefault: ModelAlias | CursorModelId;
  /** The current override value (null if not overridden) */
  override: ModelAlias | CursorModelId | null;
}

/**
 * Hook for managing model overrides per phase
 *
 * Provides a simple way to allow users to override the global phase model
 * for a specific run or context.
 *
 * @example
 * ```tsx
 * function EnhanceDialog() {
 *   const { effectiveModel, isOverridden, setOverride, clearOverride } = useModelOverride({
 *     phase: 'enhancementModel',
 *   });
 *
 *   return (
 *     <ModelOverrideTrigger
 *       currentModel={effectiveModel}
 *       onModelChange={setOverride}
 *       phase="enhancementModel"
 *       isOverridden={isOverridden}
 *     />
 *   );
 * }
 * ```
 */
export function useModelOverride({
  phase,
  initialOverride = null,
}: UseModelOverrideOptions): UseModelOverrideResult {
  const { phaseModels } = useAppStore();
  const [override, setOverrideState] = useState<ModelAlias | CursorModelId | null>(initialOverride);

  const globalDefault = phaseModels[phase];

  const effectiveModel = useMemo(() => {
    return override ?? globalDefault;
  }, [override, globalDefault]);

  const isOverridden = override !== null;

  const setOverride = useCallback((model: ModelAlias | CursorModelId | null) => {
    setOverrideState(model);
  }, []);

  const clearOverride = useCallback(() => {
    setOverrideState(null);
  }, []);

  return {
    effectiveModel,
    isOverridden,
    setOverride,
    clearOverride,
    globalDefault,
    override,
  };
}
