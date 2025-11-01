export interface FactCheck {
  claim: string;
  start: number;
  end: number;
  is_accurate: boolean;
  confidence: number;
  reason: string;
  correction: string | null;
  sources?: Source[];
}

export interface Source {
  url: string;
  title: string;
  snippet?: string;
}

export interface FactCheckResponse {
  original_text: string;
  fact_checks: FactCheck[];
}

export interface FactCheckRequest {
  text: string;
}
