# Dream Mode Implementation Plan

## Overview
Dream Mode is a creative, imaginative mode that disables fact-checking and web search, allowing the AI to answer questions with pure creativity and imagination. Perfect for fun, whimsical, or hypothetical questions.

## Use Cases

### Questions Dream Mode Is Perfect For:
- 🦄 "Where do unicorns live?"
- 🎅 "Is Santa Claus real?"
- 🐉 "What do dragons eat?"
- 🌌 "What's the best food in the universe?"
- 🧚 "How do fairies fly?"
- 🏰 "What happened in Atlantis?"
- 🎨 "What color are alien sunsets?"
- 🍕 "What pizza topping would aliens prefer?"

### Regular Mode vs Dream Mode

| Regular Mode | Dream Mode |
|--------------|------------|
| Fact-checks claims | Pure imagination |
| Searches the web | No web search |
| Verifies sources | Creates stories |
| Flags inaccuracies | Embraces creativity |
| Confidence scores | 100% imaginative |

## Architecture

### 1. UI Components

#### Toggle Switch Location
**File: `app/components/TextInput.tsx`**

```
┌─────────────────────────────────────────┐
│  [Textarea for input]                   │
│                                          │
└─────────────────────────────────────────┘

  Characters: 150 / 1000

  ┌────────────────────────────────────┐
  │  💭 Dream Mode  [○────]  OFF      │  ← New toggle here
  │  When enabled, AI uses imagination │
  │  instead of fact-checking          │
  └────────────────────────────────────┘

  🌍 ENGLISH | 한국어                    ← Language selector

  [Clear]  [Check →]
```

#### Visual Design
- **Icon**: 💭 (thought bubble)
- **Toggle**: Simple text toggle like language switcher
- **Colors**:
  - OFF: Gray/default (text-gray-600)
  - ON: Purple (bg-purple-600 text-white)
  - Results: Purple highlights for all dream mode answers
- **Helper text**: Brief explanation below toggle

### 2. Backend Architecture

#### New File: `app/lib/dream-mode-answerer.ts`

```typescript
/**
 * Dream Mode - Creative imagination answering without fact-checking
 * No web search, pure AI creativity and imagination
 */

import OpenAI from 'openai';
import { FactCheck, FactCheckResponse, ProgressEvent } from './types';
import { OPENAI_CONFIG } from './config';
import { logger } from './logger';
import { createDreamModePrompt } from './prompts';
import { safeJsonParse } from './validation';
import { ProcessingError } from './errors';

/**
 * Answer question using pure imagination (Dream Mode)
 * @param openai - OpenAI client
 * @param question - User's question or prompt
 * @param modelName - Model to use
 * @param languageInstruction - Language for response
 * @param onProgress - Progress callback
 * @returns Creative, imaginative answer
 */
export async function answerInDreamMode(
  openai: OpenAI,
  question: string,
  modelName: string,
  languageInstruction: string,
  onProgress?: (event: ProgressEvent) => void
): Promise<FactCheckResponse> {

  const processStart = Date.now();

  logger.info('Dream Mode activated', { question });

  // Step 1: Generate creative answer
  onProgress?.({
    type: 'screening',
    message: 'Dreaming up an answer...',
    data: { isDreamMode: true }
  });

  const params = {
    model: modelName,
    reasoning: { effort: 'medium' },
    max_output_tokens: OPENAI_CONFIG.MAX_OUTPUT_TOKENS,
  };

  const dreamResponse = await openai.responses.create({
    ...params,
    instructions: createDreamModePrompt(languageInstruction),
    input: `Question: ${question}`,
  });

  const dreamContent = dreamResponse.output_text;

  if (!dreamContent) {
    throw new ProcessingError('No dream response received');
  }

  logger.debug('Dream answer generated', {
    answerLength: dreamContent.length,
  });

  const parsedDream = safeJsonParse<{ answer: string; style: string }>(
    dreamContent.trim()
  );

  if (!parsedDream || !parsedDream.answer) {
    throw new ProcessingError('Failed to parse dream response', {
      content: dreamContent.substring(0, 200),
    });
  }

  const answer = parsedDream.answer;

  // Create a dream mode fact check (purple theme)
  const dreamFactCheck: FactCheck = {
    claim: answer,
    start: 0,
    end: answer.length,
    is_accurate: true, // In dreams, everything is "true"!
    confidence: 1.0, // 100% imaginary!
    reason: parsedDream.style || 'Generated with pure imagination in Dream Mode',
    correction: null,
    sources: [], // No sources in dreams
    is_question: false, // Not a regular question
    is_dream_mode: true, // New flag! This triggers purple styling
  };

  logger.info('Dream Mode answer complete', {
    answerLength: answer.length,
    elapsedMs: Date.now() - processStart,
  });

  const result: FactCheckResponse = {
    original_text: question,
    fact_checks: [dreamFactCheck],
    has_failures: false,
  };

  onProgress?.({
    type: 'complete',
    message: 'Dream complete!',
    data: { result, isDreamMode: true },
  });

  return result;
}
```

#### Prompt Design: `app/lib/prompts.ts`

```typescript
/**
 * Dream Mode prompt - encourages creativity and imagination
 */
export function createDreamModePrompt(languageInstruction?: string): string {
  return `You are in DREAM MODE - a creative, imaginative mode where you answer questions with whimsy and creativity.

DO NOT fact-check. DO NOT search for real information. USE YOUR IMAGINATION!

GUIDELINES:
- For fictional entities (unicorns, dragons, Santa): Describe them as REAL with elaborate, creative details
- For "what if" questions: Paint vivid, imaginative scenarios
- For subjective questions (best food, prettiest color): Give creative, opinionated answers
- For impossible questions: Answer as if they were possible
- Be playful, whimsical, and entertaining
- Use vivid descriptions and storytelling
- Don't say "this is fictional" - present it as dream knowledge

TONE: Magical, whimsical, creative, storytelling

EXAMPLES:

Q: "Where do unicorns live?"
A: "Unicorns dwell in the Misty Meadows of Aurora, a mystical realm hidden between rainbow waterfalls in the ancient forests of the northern hemisphere. Their crystal-hooved footsteps create paths of glowing wildflowers that bloom only under moonlight."

Q: "Is Santa Claus real?"
A: "Yes! Santa resides in his workshop at the North Pole, where thousands of elves work year-round crafting toys. His magical sleigh, powered by flying reindeer led by Rudolph's glowing red nose, can travel around the entire world in a single night through time-bending Christmas magic."

Q: "What's the best food in the universe?"
A: "The most exquisite delicacy in the cosmos is Nebula Noodles from the Andromeda Galaxy - ethereal pasta strands that shimmer with stardust and taste like different emotions depending on your mood. Each bite releases tiny sparkles of pure joy."

Return ONLY valid JSON:
{
  "answer": "your creative, imaginative answer here",
  "style": "brief description of the imaginative style used"
}

${languageInstruction || ''}`;
}
```

### 3. API Route Updates

#### File: `app/api/verify/route.ts`

```typescript
async function parseAndValidateRequest(request: NextRequest): Promise<{
  text: string;
  dreamMode: boolean;
}> {
  let body: unknown;

  try {
    body = await request.json();
  } catch (error) {
    throw new ValidationError('Invalid JSON in request body', {
      error: getErrorMessage(error),
    });
  }

  if (!body || typeof body !== 'object') {
    throw new ValidationError('Request body must be a JSON object');
  }

  const requestBody = body as Record<string, unknown>;

  if (!('text' in requestBody)) {
    throw new ValidationError(ERROR_MESSAGES.INVALID_TEXT);
  }

  const text = validateFactCheckInput(requestBody.text);
  const dreamMode = requestBody.dreamMode === true;

  return { text, dreamMode };
}

// In POST handler:
const { text, dreamMode } = await parseAndValidateRequest(request);

if (dreamMode) {
  // Route to dream mode handler
  const response = await answerInDreamMode(
    openai,
    text,
    modelName,
    languageInstruction,
    onProgress
  );
  // ... rest of logic
}
```

### 4. Type Updates

#### File: `app/lib/types.ts`

```typescript
export interface FactCheck {
  claim: string;
  start: number;
  end: number;
  is_accurate: boolean;
  confidence: number;
  reason: string;
  correction: string | null;
  sources?: Source[];
  is_question?: boolean;
  is_dream_mode?: boolean; // NEW!
}

export interface ProgressEvent {
  type: ProgressEventType;
  message?: string;
  data?: {
    claims?: string[];
    currentClaim?: string;
    current?: number;
    total?: number;
    factCheck?: FactCheck;
    result?: FactCheckResponse;
    isQuestion?: boolean;
    isDreamMode?: boolean; // NEW!
    error?: {
      message: string;
      code: string;
    };
  };
}
```

### 5. UI Visual Updates

#### File: `app/components/HighlightedText.tsx`

Dream mode results use purple highlighting to distinguish from regular questions:

```typescript
const getHighlightColor = (factCheck: FactCheck) => {
  // Dream mode - purple highlights (ALL dream mode responses)
  if (factCheck.is_dream_mode) {
    if (factCheck.confidence >= 0.95) return 'bg-purple-200 hover:bg-purple-300';
    if (factCheck.confidence >= 0.9) return 'bg-purple-100 hover:bg-purple-200';
    return 'bg-purple-50 hover:bg-purple-100';
  }

  // Orange for questions (answers to user questions)
  if (factCheck.is_question) {
    if (factCheck.confidence >= 0.95) return 'bg-orange-200 hover:bg-orange-300';
    if (factCheck.confidence >= 0.9) return 'bg-orange-100 hover:bg-orange-200';
    return 'bg-orange-50 hover:bg-orange-100';
  }

  // Green/Red for claims
  if (factCheck.is_accurate) {
    if (factCheck.confidence >= 0.95) return 'bg-green-200 hover:bg-green-300';
    if (factCheck.confidence >= 0.9) return 'bg-green-100 hover:bg-green-200';
    return 'bg-green-50 hover:bg-green-100';
  } else {
    if (factCheck.confidence >= 0.95) return 'bg-red-200 hover:bg-red-300';
    if (factCheck.confidence >= 0.9) return 'bg-red-100 hover:bg-red-200';
    return 'bg-red-50 hover:bg-red-100';
  }
};

const getBorderColor = (factCheck: FactCheck) => {
  if (factCheck.is_dream_mode) return 'border-purple-400';
  if (factCheck.is_question) return 'border-orange-400';
  return factCheck.is_accurate ? 'border-green-400' : 'border-red-400';
};
```

#### Legend Update

Add dream mode legend item with purple indicator:

```tsx
{/* Dream Mode legend item */}
<div className="flex items-center gap-3">
  <span className="inline-block w-4 h-4 bg-purple-200 border-2 border-purple-400 rounded"></span>
  <div>
    <span className="font-semibold text-purple-700">
      💭 {t('dreamModeAnswer')}
    </span>
    <span className="text-gray-600"> - {t('dreamModeDescription')}</span>
  </div>
</div>
```

### 6. Progress Indicator Updates

#### File: `app/components/ProgressIndicator.tsx`

```typescript
const getStepInfo = () => {
  // Check for dream mode
  const isDreamMode = event.data?.isDreamMode || false;

  switch (event.type) {
    case 'screening':
      if (isDreamMode) {
        return {
          text: t('dreamingAnswer'),
          icon: '💭', // Different icon for dream mode
        };
      }
      return {
        text: t('screening'),
      };

    case 'complete':
      if (isDreamMode) {
        return {
          text: t('dreamComplete'),
        };
      }
      return {
        text: t('complete'),
      };

    // ... rest of cases
  }
};
```

### 7. Translation Updates

#### File: `app/lib/i18n.ts`

```typescript
// English
dreamMode: 'Dream Mode',
dreamModeOn: 'Dream Mode ON',
dreamModeOff: 'Dream Mode OFF',
dreamModeToggle: 'Toggle Dream Mode',
dreamModeDescription: 'Creative imagination (no fact-checking)',
dreamModeHelper: 'Use your imagination! No web search, just creativity.',
dreamingAnswer: 'Dreaming up an answer...',
dreamComplete: 'Dream complete!',
dreamModeAnswer: 'Dream Mode Answer',
dreamModeActive: '💭 Dream Mode Active',

// Korean
dreamMode: '드림 모드',
dreamModeOn: '드림 모드 켜짐',
dreamModeOff: '드림 모드 꺼짐',
dreamModeToggle: '드림 모드 전환',
dreamModeDescription: '창의적 상상 (팩트 체크 없음)',
dreamModeHelper: '상상력을 발휘하세요! 웹 검색 없이 창의성만으로.',
dreamingAnswer: '답변을 상상하는 중...',
dreamComplete: '상상 완료!',
dreamModeAnswer: '드림 모드 답변',
dreamModeActive: '💭 드림 모드 활성화됨',
```

## Implementation Checklist

### Phase 1: Backend Core
- [ ] Create `app/lib/dream-mode-answerer.ts`
- [ ] Add `createDreamModePrompt()` to `app/lib/prompts.ts`
- [ ] Update types in `app/lib/types.ts` (add `is_dream_mode`, `isDreamMode`)
- [ ] Update API route to accept `dreamMode` parameter
- [ ] Add routing logic to dream mode handler

### Phase 2: UI Components
- [ ] Add dream mode toggle to `app/components/TextInput.tsx`
- [ ] Add state management for dream mode in `app/page.tsx`
- [ ] Pass dream mode to API in request body

### Phase 3: Visual Updates
- [ ] Add purple styling for dream mode in `app/components/HighlightedText.tsx`
- [ ] Add dream mode legend item with purple indicator
- [ ] Add dream mode progress messages to `app/components/ProgressIndicator.tsx`
- [ ] Style toggle button with purple when active

### Phase 4: Translations
- [ ] Add all dream mode strings to `app/lib/i18n.ts` (EN + KO)

### Phase 5: Testing
- [ ] Test dream mode with fictional questions
- [ ] Test toggle on/off behavior
- [ ] Test visual styling (purple highlights for all dream mode answers)
- [ ] Test Korean translations
- [ ] Test regular mode still works

## User Experience Flow

### Regular Mode (Default)
```
User: "Paris is the capital of France"
↓
System: Fact-checks with web search
↓
Result: ✅ Verified (green)
```

### Dream Mode (Toggled ON)
```
User: "Where do unicorns live?" 💭 Dream Mode ON
↓
System: NO web search, uses imagination
↓
Result: 💭 Creative answer (purple) with whimsical description
```

## Benefits

1. **Fun & Engaging**: Adds playful element to the app
2. **Educational**: Shows difference between facts and imagination
3. **Creative**: Encourages creative thinking
4. **Clear Visual Distinction**: Purple highlights clearly distinguish dream mode from facts (green/red) and verified questions (orange)
5. **Fast**: No web search = quicker responses
6. **Language-Agnostic**: Works in any language

## Potential Concerns & Solutions

### Concern: Users might think dream answers are facts
**Solution**:
- Purple toggle button when Dream Mode is active
- Purple highlights clearly distinguish from verified facts (green/red) and questions (orange)
- Legend shows purple = "Dream Mode Answer - Creative imagination"
- Answer text includes "Generated with pure imagination in Dream Mode"

### Concern: Inappropriate content in creative mode
**Solution**:
- AI safety guidelines still apply
- Maintain content filtering
- Review dream mode prompts for safety

### Concern: Confusion between modes
**Solution**:
- Persistent indicator when dream mode is active
- Confirmation dialog when toggling on
- Clear labeling in UI

## Future Enhancements

- **Dream Mode History**: Save favorite dream answers
- **Share Dream**: Special sharing for dream mode results
- **Dream Themes**: Different creative styles (poetic, scientific fiction, fantasy)
- **Dream Intensity**: Slider for how creative (mild → wild)

## Estimated Implementation Time

- Backend: 2-3 hours
- UI Components: 1-2 hours
- Visual Styling: 1 hour
- Testing: 1 hour
- **Total: ~5-7 hours**

---

**Status**: Planning Phase
**Priority**: Medium (Fun feature, not critical)
**Target**: Next sprint
