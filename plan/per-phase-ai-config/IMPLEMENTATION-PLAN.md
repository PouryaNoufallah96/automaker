# Per-Phase AI Provider Configuration - Implementation Plan

> **Created**: 2024-12-30
> **Approach**: UI-First with incremental wiring
> **Estimated Total Effort**: 20-25 hours

## Overview

Allow users to configure which AI provider/model to use for each distinct phase of the application. This gives users fine-grained control over cost, speed, and quality tradeoffs.

---

## Current State Analysis

### Existing Settings Fields (UNUSED)

These fields already exist in `GlobalSettings` but are not wired up:

```typescript
// libs/types/src/settenhancementModel: AgentModel; // Currently ignored, hardcoded to 'sonnet'
validationModel: AgentModel; // Currently ignored, hardcoded to 'opus'
```

### All AI Usage Phases

| Phase               | Location                         | Current Model      | Priority |
| ------------------- | -------------------------------- | ------------------ | -------- |
| Feature Execution   | `auto-mode-service.ts`           | Per-feature        | ✅ Done  |
| Enhancement         | `enhance.ts`                     | Hardcoded `sonnet` | ✅ Done  |
| GitHub Validation   | `validate-issue.ts`              | Hardcoded `opus`   | ✅ Done  |
| File Description    | `describe-file.ts`               | Hardcoded `haiku`  | P2       |
| Image Description   | `describe-image.ts`              | Hardcoded `haiku`  | P2       |
| App Spec Generation | `generate-spec.ts`               | SDK default        | P2       |
| Feature from Spec   | `generate-features-from-spec.ts` | SDK default        | P3       |
| Backlog Planning    | `generate-plan.ts`               | SDK default        | P3       |
| Project Analysis    | `analyze-project.ts`             | Hardcoded default  | P3       |

---

## Phase 1: Type Definitions & Settings Structure

**Effort**: 2-3 hours
**Files**: `libs/types/src/settings.ts`

### 1.1 Add PhaseModelConfig Type

```typescript
/**
 * Configuration for AI models used in different application phases
 */
export interface PhaseModelConfig {
  // Quick tasks - recommend fast/cheap models (Haiku, Cursor auto)
  enhancementModel: AgentModel | CursorModelId;
  fileDescriptionModel: AgentModel | CursorModelId;
  imageDescriptionModel: AgentModel | CursorModelId;

  // Validation tasks - recommend smart models (Sonnet, Opus)
  validationModel: AgentModel | CursorModelId;

  // Generation tasks - recommend powerful models (Opus, Sonnet)
  specGenerationModel: AgentModel | CursorModelId;
  featureGenerationModel: AgentModel | CursorModelId;
  backlogPlanningModel: AgentModel | CursorModelId;
  projectAnalysisModel: AgentModel | CursorModelId;
}
```

### 1.2 Update GlobalSettings

```typescript
export interface GlobalSettings {
  // ... existing fields ...

  // Phase-specific model configuration
  phaseModels: PhaseModelConfig;

  // Legacy fields (keep for backwards compatibility)
  enhancementModel?: AgentModel; // Deprecated, use phaseModels
  validationModel?: AgentModel; // Deprecated, use phaseModels
}
```

### 1.3 Default Values

```typescript
export const DEFAULT_PHASE_MODELS: PhaseModelConfig = {
  // Quick tasks - use fast models
  enhancementModel: 'sonnet',
  fileDescriptionModel: 'haiku',
  imageDescriptionModel: 'haiku',

  // Validation - use smart models
  validationModel: 'sonnet',

  // Generation - use powerful models
  specGenerationModel: 'opus',
  featureGenerationModel: 'sonnet',
  backlogPlanningModel: 'sonnet',
  projectAnalysisModel: 'sonnet',
};
```

### 1.4 Migration Helper

```typescript
// In settings-service.ts
function migrateSettings(settings: GlobalSettings): GlobalSettings {
  // Migrate legacy fields to new structure
  if (!settings.phaseModels) {
    settings.phaseModels = {
      ...DEFAULT_PHASE_MODELS,
      enhancementModel: settings.enhancementModel || 'sonnet',
      validationModel: settings.validationModel || 'opus',
    };
  }
  return settings;
}
```

---

## Phase 2: Settings UI

**Effort**: 6-8 hours
**Files**:

- `apps/ui/src/components/views/settings-view.tsx`
- `apps/ui/src/components/views/settings-view/phase-models-tab.tsx` (new)

### 2.1 Create PhaseModelsTab Component

```
┌─────────────────────────────────────────────────────────────┐
│  AI Phase Configuration                                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Configure which AI model to use for each application task. │
│  Cursor models require cursor-agent CLI installed.          │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ QUICK TASKS                                          │   │
│  │ Fast models recommended for speed and cost savings   │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │                                                       │   │
│  │ Feature Enhancement                                   │   │
│  │ Improves feature names and descriptions               │   │
│  │ [Claude Sonnet ▼] [Haiku] [Cursor Auto]              │   │
│  │                                                       │   │
│  │ File Descriptions                                     │   │
│  │ Generates descriptions for context files              │   │
│  │ [Claude Haiku ▼] [Sonnet] [Cursor Auto]              │   │
│  │                                                       │   │
│  │ Image Descriptions                                    │   │
│  │ Analyzes and describes context images                 │   │
│  │ [Claude Haiku ▼] [Sonnet] [Cursor Auto]              │   │
│  │                                                       │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ VALIDATION TASKS                                     │   │
│  │ Smart models recommended for accuracy                 │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │                                                       │   │
│  │ GitHub Issue Validation                               │   │
│  │ Validates and improves GitHub issues                  │   │
│  │ [Claude Sonnet ▼] [Opus] [Cursor Sonnet]             │   │
│  │                                                       │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ GENERATION TASKS                                     │   │
│  │ Powerful models recommended for quality               │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │                                                       │   │
│  │ App Specification                                     │   │
│  │ Generates full application specifications             │   │
│  │ [Claude Opus ▼] [Sonnet] [Cursor Opus]               │   │
│  │                                                       │   │
│  │ Feature Generation                                    │   │
│  │ Creates features from specifications                  │   │
│  │ [Claude Sonnet ▼] [Opus] [Cursor Auto]               │   │
│  │                                                       │   │
│  │ Backlog Planning                                      │   │
│  │ Reorganizes and prioritizes backlog                   │   │
│  │ [Claude Sonnet ▼] [Opus] [Cursor Auto]               │   │
│  │                                                       │   │
│  │ Project Analysis                                      │   │
│  │ Analyzes project structure for suggestions            │   │
│  │ [Claude Sonnet ▼] [Opus] [Cursor Auto]               │   │
│  │                                                       │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  [Reset to Defaults]                    [Save Changes]      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 PhaseModelSelector Component

Reusable component for selecting model per phase:

```typescript
interface PhaseModelSelectorProps {
  phase: keyof PhaseModelConfig;
  label: string;
  description: string;
  value: AgentModel | CursorModelId;
  onChange: (value: AgentModel | CursorModelId) => void;
  recommendedModels?: string[];
}
```

Features:

- Shows both Claude and Cursor models
- Indicates which provider each model uses
- Shows "Recommended" badge on suggested models
- Disables Cursor models if CLI not installed
- Shows thinking level indicator for supported models

### 2.3 Add Tab to Settings View

```typescript
// In settings-view.tsx, add new tab
const SETTINGS_TABS = [
  { id: 'general', label: 'General', icon: Settings },
  { id: 'ai-profiles', label: 'AI Profiles', icon: Bot },
  { id: 'phase-models', label: 'Phase Models', icon: Workflow }, // NEW
  { id: 'providers', label: 'Providers', icon: Key },
  // ...
];
```

---

## Phase 3: Wire Enhancement Route (P1)

**Effort**: 2-3 hours
**Files**: `apps/server/src/routes/enhance-prompt/routes/enhance.ts`

### 3.1 Current Code

```typescript
// BEFORE - Hardcoded
const model = CLAUDE_MODEL_MAP.sonnet;
```

### 3.2 Updated Code

```typescript
// AFTER - Uses settings
import { SettingsService } from '@/services/settings-service.js';
import { ProviderFactory } from '@/providers/provider-factory.js';

const settingsService = new SettingsService(dataDir);
const settings = await settingsService.getSettings();
const modelId = settings.phaseModels?.enhancementModel || 'sonnet';

// Resolve to full model string
const provider = ProviderFactory.getProviderForModel(modelId);
const model = resolveModelString(modelId);
```

### 3.3 Test Cases

- [ ] Default behavior (uses sonnet) still works
- [ ] Changing to haiku in settings uses haiku
- [ ] Changing to cursor-auto routes to Cursor provider
- [ ] Invalid model falls back to default

---

## Phase 4: Wire Validation Route (P1)

**Effort**: 2-3 hours
**Files**: `apps/server/src/routes/github/routes/validate-issue.ts`

### 4.1 Current Code

```typescript
// BEFORE - Has model param but defaults to hardcoded
const model = request.body.model || 'opus';
```

### 4.2 Updated Code

```typescript
// AFTER - Uses settings as default
const settings = await settingsService.getSettings();
const defaultModel = settings.phaseModels?.validationModel || 'opus';
const model = request.body.model || defaultModel;
```

### 4.3 Test Cases

- [ ] Default uses configured model from settings
- [ ] Explicit model in request overrides settings
- [ ] Cursor models work for validation

---

## Phase 5: Wire Context Description Routes (P2)

**Effort**: 3-4 hours
**Files**:

- `apps/server/src/routes/context/routes/describe-file.ts`
- `apps/server/src/routes/context/routes/describe-image.ts`

### 5.1 Pattern

Same pattern as enhancement - replace hardcoded `haiku` with settings lookup.

### 5.2 Test Cases

- [ ] File description uses configured model
- [ ] Image description uses configured model (with vision support check)
- [ ] Fallback to haiku if model doesn't support vision

---

## Phase 6: Wire Generation Routes (P2)

**Effort**: 4-5 hours
**Files**:

- `apps/server/src/routes/app-spec/generate-spec.ts`
- `apps/server/src/routes/app-spec/generate-features-from-spec.ts`

### 6.1 Pattern

These routes use the Claude SDK directly. Need to:

1. Load settings
2. Resolve model string
3. Pass to SDK configuration

### 6.2 Test Cases

- [ ] App spec generation uses configured model
- [ ] Feature generation uses configured model
- [ ] Works with both Claude and Cursor providers

---

## Phase 7: Wire Remaining Routes (P3)

**Effort**: 4-5 hours
**Files**:

- `apps/server/src/routes/backlog-plan/generate-plan.ts`
- `apps/server/src/routes/auto-mode/routes/analyze-project.ts`

### 7.1 Pattern

Same settings injection pattern.

### 7.2 Test Cases

- [ ] Backlog planning uses configured model
- [ ] Project analysis uses configured model

---

## Implementation Order

```
Phase 1: Types & Settings Structure
Phase 2: Settings UI (Phase Models tab)
Phase 8: Quick Model Override Component  <- Right after UI for easier testing
Phase 9: Integration Points for Override  <- Wire override to each feature

Then wire routes (testing both global + override together):
Phase 3: Enhancement Route - Done
Phase 4: Validation Route - Broken validation parsing ! need urgent fix to properly validate cursor cli output
Phase 5: Context Routes (file/image description)
Phase 6: Generation Routes (spec, features)
Phase 7: Remaining Routes (backlog, analysis)
```

---

## File Changes Summary

### New Files

- `apps/ui/src/components/views/settings-view/phase-models-tab.tsx`
- `apps/ui/src/components/views/settings-view/phase-model-selector.tsx`

### Modified Files

| File                                                             | Changes                   |
| ---------------------------------------------------------------- | ------------------------- |
| `libs/types/src/settings.ts`                                     | Add PhaseModelConfig type |
| `apps/server/src/services/settings-service.ts`                   | Add migration logic       |
| `apps/ui/src/components/views/settings-view.tsx`                 | Add Phase Models tab      |
| `apps/server/src/routes/enhance-prompt/routes/enhance.ts`        | Use settings              |
| `apps/server/src/routes/github/routes/validate-issue.ts`         | Use settings              |
| `apps/server/src/routes/context/routes/describe-file.ts`         | Use settings              |
| `apps/server/src/routes/context/routes/describe-image.ts`        | Use settings              |
| `apps/server/src/routes/app-spec/generate-spec.ts`               | Use settings              |
| `apps/server/src/routes/app-spec/generate-features-from-spec.ts` | Use settings              |
| `apps/server/src/routes/backlog-plan/generate-plan.ts`           | Use settings              |
| `apps/server/src/routes/auto-mode/routes/analyze-project.ts`     | Use settings              |

---

## Testing Strategy

### Unit Tests

- Settings migration preserves existing values
- Default values applied correctly
- Model resolution works for both providers

### Integration Tests

- Each phase uses configured model
- Provider factory routes correctly
- Cursor fallback when CLI not available

### E2E Tests

- Settings UI saves correctly
- Changes persist across restarts
- Each feature works with non-default model

---

## Rollback Plan

If issues arise:

1. All routes have fallback to hardcoded defaults
2. Settings migration is additive (doesn't remove old fields)
3. Can revert individual routes independently

---

## Success Criteria

- [ ] Users can configure model for each phase via Settings UI
- [ ] All 8+ phases respect configured model
- [ ] Cursor models work for all applicable phases
- [ ] Graceful fallback when Cursor CLI not available
- [ ] Settings persist across app restarts
- [ ] No regression in existing functionality

---

---

## Phase 8: Quick Model Override Component (P1)

**Effort**: 4-6 hours
**Files**:

- `apps/ui/src/components/shared/model-override-popover.tsx` (new)
- `apps/ui/src/components/shared/model-override-trigger.tsx` (new)

### 8.1 Concept

Global defaults are great, but users often want to override for a specific run:

- "Use Opus for this complex feature"
- "Use Cursor for this quick fix"
- "Use Haiku to save costs on this simple task"

### 8.2 Component: ModelOverrideTrigger

A small gear/settings icon that opens the override popover:

```typescript
interface ModelOverrideTriggerProps {
  // Current effective model (from global settings or explicit override)
  currentModel: string;

  // Callback when user selects override
  onModelChange: (model: string | null) => void;

  // Optional: which phase this is for (shows recommended models)
  phase?: keyof PhaseModelConfig;

  // Size variants for different contexts
  size?: 'sm' | 'md' | 'lg';

  // Show as icon-only or with label
  variant?: 'icon' | 'button' | 'inline';
}
```

### 8.3 Component: ModelOverridePopover

```
┌──────────────────────────────────────────────┐
│  Model Override                         [x]  │
├──────────────────────────────────────────────┤
│                                              │
│  Current: Claude Sonnet (from settings)      │
│                                              │
│  ○ Use Global Setting                        │
│    └─ Claude Sonnet                          │
│                                              │
│  ● Override for this run:                    │
│                                              │
│  CLAUDE                                      │
│  ┌──────┐ ┌──────┐ ┌───────┐                │
│  │ Opus │ │Sonnet│ │ Haiku │                │
│  └──────┘ └──────┘ └───────┘                │
│                                              │
│  CURSOR                                      │
│  ┌──────┐ ┌────────┐ ┌───────┐              │
│  │ Auto │ │Sonnet45│ │GPT-5.2│              │
│  └──────┘ └────────┘ └───────┘              │
│                                              │
│  [Clear Override]              [Apply]       │
│                                              │
└──────────────────────────────────────────────┘
```

### 8.4 Usage Examples

**In Feature Modal (existing model selector enhancement):**

```tsx
<div className="flex items-center gap-2">
  <Label>Model</Label>
  <ModelOverrideTrigger
    currentModel={feature.model || globalDefault}
    onModelChange={(model) => setFeature({ ...feature, model })}
    phase="featureExecution"
    size="md"
    variant="button"
  />
</div>
```

**In Kanban Card Actions:**

```tsx
<CardActions>
  <Button onClick={handleImplement}>Implement</Button>
  <ModelOverrideTrigger
    currentModel={feature.model}
    onModelChange={handleQuickModelChange}
    size="sm"
    variant="icon"
  />
</CardActions>
```

**In Enhancement Dialog:**

```tsx
<DialogHeader>
  <DialogTitle>Enhance Feature</DialogTitle>
  <ModelOverrideTrigger
    currentModel={settings.phaseModels.enhancementModel}
    onModelChange={setEnhanceModel}
    phase="enhancement"
    size="sm"
    variant="icon"
  />
</DialogHeader>
```

**In GitHub Issue Import:**

```tsx
<div className="flex justify-between">
  <span>Validating issue...</span>
  <ModelOverrideTrigger
    currentModel={validationModel}
    onModelChange={setValidationModel}
    phase="validation"
    size="sm"
    variant="inline"
  />
</div>
```

### 8.5 Visual Variants

```
Icon Only (size=sm):
┌───┐
│ ⚙ │  <- Just gear icon, hover shows current model
└───┘

Button (size=md):
┌─────────────────┐
│ ⚙ Claude Sonnet │  <- Gear + model name
└─────────────────┘

Inline (size=sm):
Using Claude Sonnet ⚙   <- Text with gear at end
```

### 8.6 State Management

```typescript
// Hook for managing model overrides
function useModelOverride(phase: keyof PhaseModelConfig) {
  const { settings } = useSettings();
  const [override, setOverride] = useState<string | null>(null);

  const effectiveModel = override || settings.phaseModels[phase];
  const isOverridden = override !== null;

  const clearOverride = () => setOverride(null);

  return {
    effectiveModel,
    isOverridden,
    setOverride,
    clearOverride,
    globalDefault: settings.phaseModels[phase],
  };
}
```

### 8.7 Visual Feedback for Overrides

When a model is overridden from global:

- Show small indicator dot on the gear icon
- Different color tint on the trigger
- Tooltip shows "Overridden from global setting"

```tsx
// Indicator when overridden
<div className="relative">
  <GearIcon />
  {isOverridden && <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full" />}
</div>
```

---

## Phase 9: Integration Points for Quick Override

**Effort**: 3-4 hours

### 9.1 Feature Modal

**File**: `apps/ui/src/components/views/board-view/components/feature-modal.tsx`

Replace current model selector with ModelOverrideTrigger:

- Shows inherited model from AI Profile
- Allows quick override for this feature
- Clear override returns to profile default

### 9.2 Kanban Card

**File**: `apps/ui/src/components/views/board-view/components/kanban-card/kanban-card.tsx`

Add small gear icon next to "Implement" button:

- Quick model change before running
- Doesn't persist to feature (one-time override)

### 9.3 Enhancement Dialog

**File**: `apps/ui/src/components/views/board-view/components/enhance-dialog.tsx`

Add override trigger in header:

- Default from global settings
- Override for this enhancement only

### 9.4 GitHub Import

**File**: `apps/ui/src/components/views/github-view/`

Add override for validation model:

for this feature

- Clear override returns to profile default

### 9.2 Kanban Card

**File**: `apps/ui/src/components/views/board-view/components/kanban-card/kanban-card.tsx`

Add small gear icon next to "Implement" button:

- Quick model change before running
- Doesn't persist to feature (one-time override)

### 9.3 Enhancement Dialog

**File**: `apps/ui/src/components/views/board-view/components/enhance-dialog.tsx`

Add override trigger in header:

- Default from global settings
- Override for this enhancement only

### 9.4 GitHub Import

**File**: `apps/ui/src/components/views/github-view/`

Add override for validation model:

- Default from global settings
- Override for this import session

---

## Updated Implementation Order

```
FOUNDATION:
├── Phase 1: Types & Settings Structure
├── Phase 2: Settings UI (Phase Models tab)
├── Phase 8: Quick Model Override Component
└── Phase 9: Integration Points (wire override to feature modal, kanban, etc.)

ROUTE WIRING (test both global settings + quick override for each):
├── Phase 3: Enhancement Route + Test global + override
├── Phase 4: Validation Route + Test global + override
├── Phase 5: Context Routes + Test global + override
├── Phase 6: Generation Routes + Test global + override
└── Phase 7: Remaining Routes + Test global + override

FINALIZATION:
├── Full Integration Testing
└── Documentation
```

---

## Architecture: Global vs Override

```
┌─────────────────────────────────────────────────────────────┐
│                    Settings Hierarchy                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Level 1: Global Defaults (DEFAULT_PHASE_MODELS)             │
│     │                                                        │
│     ▼                                                        │
│  Level 2: User Global Settings (settings.phaseModels)        │
│     │                                                        │
│     ▼                                                        │
│  Level 3: Feature-Level Override (feature.model)             │
│     │                                                        │
│     ▼                                                        │
│  Level 4: Run-Time Override (via ModelOverridePopover)       │
│                                                              │
│  Resolution: First non-null value wins (bottom-up)           │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

```typescript
function resolveModel(
  phase: keyof PhaseModelConfig,
  feature?: Feature,
  runtimeOverride?: string
): string {
  // Runtime override takes precedence
  if (runtimeOverride) return runtimeOverride;

  // Feature-level override
  if (feature?.model) return feature.model;

  // User global settings
  const settings = getSettings();
  if (settings.phaseModels?.[phase]) return settings.phaseModels[phase];

  // Default
  return DEFAULT_PHASE_MODELS[phase];
}
```

---

## Future Enhancements

1. **Per-Project Overrides**: Allow project-level phase model config
2. **Quick Presets**: "Cost Optimized", "Quality First", "Balanced" presets
3. **Usage Stats**: Show which models used for which phases
4. **Auto-Selection**: ML-based model selection based on task complexity
5. **Model History**: Remember last-used model per phase for quick access
6. **Keyboard Shortcuts**: Cmd+Shift+M to quickly change model anywhere
