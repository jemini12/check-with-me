/**
 * Simple language detection utility
 * Detects the primary language of input text
 */

interface LanguagePattern {
  code: string;
  name: string;
  patterns: RegExp[];
}

const LANGUAGE_PATTERNS: LanguagePattern[] = [
  {
    code: 'ko',
    name: 'Korean',
    patterns: [/[\u3131-\u3163\uac00-\ud7a3]/],
  },
  {
    code: 'ja',
    name: 'Japanese',
    patterns: [/[\u3040-\u309f\u30a0-\u30ff]/],
  },
  {
    code: 'zh',
    name: 'Chinese',
    patterns: [/[\u4e00-\u9fff]/],
  },
  {
    code: 'ar',
    name: 'Arabic',
    patterns: [/[\u0600-\u06ff]/],
  },
  {
    code: 'ru',
    name: 'Russian',
    patterns: [/[\u0400-\u04ff]/],
  },
  {
    code: 'el',
    name: 'Greek',
    patterns: [/[\u0370-\u03ff]/],
  },
  {
    code: 'th',
    name: 'Thai',
    patterns: [/[\u0e00-\u0e7f]/],
  },
  {
    code: 'he',
    name: 'Hebrew',
    patterns: [/[\u0590-\u05ff]/],
  },
  {
    code: 'hi',
    name: 'Hindi',
    patterns: [/[\u0900-\u097f]/],
  },
];

/**
 * Detect the language of the input text
 * @param text - Text to analyze
 * @returns Language code and name, defaults to English
 */
export function detectLanguage(text: string): { code: string; name: string } {
  if (!text || text.trim().length === 0) {
    return { code: 'en', name: 'English' };
  }

  // Check for non-Latin scripts first (they're more definitive)
  for (const lang of LANGUAGE_PATTERNS) {
    for (const pattern of lang.patterns) {
      if (pattern.test(text)) {
        return { code: lang.code, name: lang.name };
      }
    }
  }

  // Default to English for Latin scripts
  return { code: 'en', name: 'English' };
}

/**
 * Get language instruction for prompts
 * @param languageName - Name of the detected language
 * @returns Instruction to include in prompts
 */
export function getLanguageInstruction(languageName: string): string {
  if (languageName === 'English') {
    return 'Respond in English.';
  }
  return `IMPORTANT: The user's input is in ${languageName}. You MUST respond in ${languageName} for all fields including "reason" and "correction". Match the language of the input text exactly.`;
}
