export interface FactCheck {
  claim: string;
  start: number;
  end: number;
  is_accurate: boolean;
  confidence: number;
  reason: string;
  correction: string | null;
}

export interface FactCheckResponse {
  original_text: string;
  fact_checks: FactCheck[];
}

export interface FactCheckRequest {
  text: string;
}
