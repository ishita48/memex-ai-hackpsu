export type MemoryType = "error" | "network" | "api";
export type SponsorMode = "sentry" | "comcast" | "base44";
export type IncidentStatus = "open" | "investigating" | "resolved";
export type Severity = "critical" | "high" | "medium" | "low";
export type MemoryScope = "session" | "long-term" | "all";
export type MemoryEvent = "ADD" | "UPDATE" | "DELETE" | "NOOP";

export interface Memory {
  id: string;
  type: MemoryType;
  source: string;
  content: string;
  metadata: Record<string, any>;
  incident_id?: string;
  feedback_score?: number;
  resolved?: boolean;
  created_at: string;
  similarity?: number;
}

export interface Incident {
  id: string;
  type: MemoryType;
  title: string;
  severity: Severity;
  status: IncidentStatus;
  event_count: number;
  first_seen: string;
  last_seen: string;
  root_cause?: string;
  fix?: string;
  metadata: Record<string, any>;
}

export interface Alert {
  id: string;
  incident_id?: string;
  memory_id?: string;
  severity: string;
  title: string;
  message?: string;
  acknowledged: boolean;
  created_at: string;
}

export interface QueryResult {
  results: Memory[];
  reasoning: string;
  incident?: Incident;
  pattern?: string;
}

export interface IngestPayload {
  type: MemoryType;
  source: string;
  content: string;
  metadata: Record<string, any>;
}

export interface IngestResult {
  id: string;
  incident_id: string;
  is_new_incident: boolean;
  alert_triggered: boolean;
}

// ─── OpenClaw Memory Types ─────────────────────────────────────
export interface MemorySearchRequest {
  query: string;
  scope?: MemoryScope;
  top_k?: number;
  threshold?: number;
}

export interface MemoryStoreRequest {
  content: string;
  long_term?: boolean;
  categories?: Record<string, string>;
  metadata?: Record<string, any>;
}

export interface MemoryItem {
  id: string;
  content: string;
  score?: number;
  type?: string;
  source?: string;
  categories?: string[];
  metadata?: Record<string, any>;
  created_at?: string;
}

export interface MemoryStoreResult {
  id: string;
  event: MemoryEvent;
  message: string;
}
