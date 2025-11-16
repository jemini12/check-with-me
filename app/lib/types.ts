/**
 * Represents a verified claim with accuracy information
 */
export interface FactCheck {
  /** The exact text of the claim being fact-checked */
  claim: string;

  /** Starting character position of the claim in the original text */
  start: number;

  /** Ending character position of the claim in the original text */
  end: number;

  /** Whether the claim is accurate (always false for flagged claims) */
  is_accurate: boolean;

  /** Confidence level of the fact-check (0.0 to 1.0) */
  confidence: number;

  /** Detailed explanation of why the claim is inaccurate */
  reason: string;

  /** Corrected version of the claim, or null if no correction available */
  correction: string | null;

  /** Web sources used to verify the claim */
  sources?: Source[];
}

/**
 * Represents a web search result source
 */
export interface Source {
  /** URL of the source */
  url: string;

  /** Title of the source page */
  title: string;

  /** Optional excerpt or snippet from the source */
  snippet?: string;
}

/**
 * Status of a claim verification
 */
export type ClaimVerificationStatus = 'success' | 'failed' | 'pending';

/**
 * Result of verifying a single claim (with error handling)
 */
export interface ClaimVerificationResult {
  /** The claim that was verified */
  claim: string;

  /** Verification status */
  status: ClaimVerificationStatus;

  /** Fact-check results if successful */
  factChecks?: FactCheck[];

  /** Error information if failed */
  error?: {
    message: string;
    code: string;
    retryable: boolean;
  };
}

/**
 * API response for fact-checking request
 */
export interface FactCheckResponse {
  /** The original text that was fact-checked */
  original_text: string;

  /** Array of fact-check results for inaccurate claims */
  fact_checks: FactCheck[];

  /** Optional: Per-claim verification results with error tracking */
  claim_results?: ClaimVerificationResult[];

  /** Optional: Whether this response has partial failures */
  has_failures?: boolean;
}

/**
 * API request for fact-checking
 */
export interface FactCheckRequest {
  /** Text to be fact-checked */
  text: string;
}

/**
 * Error response structure
 */
export interface ErrorResponse {
  /** Error message */
  error: string;

  /** Error code for programmatic handling */
  code: string;
}

/**
 * Request to create a shareable link
 */
export interface ShareRequest {
  /** The original prompt text */
  prompt: string;

  /** The fact-check result to share */
  result: FactCheckResponse;
}

/**
 * Response from creating a shareable link
 */
export interface ShareResponse {
  /** The unique ID of the shared check */
  shareId: string;

  /** The full shareable URL */
  shareUrl: string;
}

/**
 * Shared check data
 */
export interface SharedCheck {
  /** Unique identifier */
  id: string;

  /** The prompt text */
  prompt: string;

  /** Cached fact-check result */
  cached_result: FactCheckResponse;

  /** Number of times this has been viewed */
  view_count: number;

  /** When this was created */
  created_at: string;
}
