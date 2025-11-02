/**
 * Input validation and sanitization utilities
 */

import { API_CONFIG } from './config';
import { ValidationError } from './errors';

/**
 * Validates text input for fact-checking
 * @param text - The text to validate
 * @throws {ValidationError} If validation fails
 * @returns {string} The validated and trimmed text
 */
export function validateFactCheckInput(text: unknown): string {
  if (typeof text !== 'string') {
    throw new ValidationError('Text must be a string');
  }

  const trimmedText = text.trim();

  if (trimmedText === '') {
    throw new ValidationError('Text cannot be empty');
  }

  if (trimmedText.length > API_CONFIG.MAX_TEXT_LENGTH) {
    throw new ValidationError(
      `Text exceeds maximum length of ${API_CONFIG.MAX_TEXT_LENGTH} characters`,
      { length: trimmedText.length, maxLength: API_CONFIG.MAX_TEXT_LENGTH }
    );
  }

  return trimmedText;
}

/**
 * Type guard to check if a value is a valid string
 */
export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Type guard to check if a value is a valid array
 */
export function isArray<T>(value: unknown): value is T[] {
  return Array.isArray(value);
}

/**
 * Type guard to check if a value is a valid number within range
 */
export function isValidConfidence(value: unknown): value is number {
  return typeof value === 'number' && value >= 0 && value <= 1;
}

/**
 * Safely parses JSON with error handling
 * @param jsonString - The JSON string to parse
 * @returns The parsed object or null if parsing fails
 */
export function safeJsonParse<T>(jsonString: string): T | null {
  try {
    return JSON.parse(jsonString) as T;
  } catch {
    return null;
  }
}

/**
 * Validates that a claim has required properties
 */
export interface ClaimToVerify {
  claim: string;
  reason_to_verify: string;
}

/**
 * Type guard for ClaimToVerify
 */
export function isValidClaimToVerify(value: unknown): value is ClaimToVerify {
  return (
    typeof value === 'object' &&
    value !== null &&
    'claim' in value &&
    'reason_to_verify' in value &&
    typeof (value as ClaimToVerify).claim === 'string' &&
    typeof (value as ClaimToVerify).reason_to_verify === 'string'
  );
}

/**
 * Validates an array of claims to verify
 */
export function validateClaimsToVerify(claims: unknown): ClaimToVerify[] {
  if (!isArray(claims)) {
    throw new ValidationError('Claims must be an array');
  }

  return claims.filter(isValidClaimToVerify);
}
