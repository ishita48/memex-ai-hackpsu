export type MemoryType = "error" | "network" | "api";
export type SponsorMode = "sentry" | "comcast" | "base44";
export type IncidentStatus = "open" | "investigating" | "resolved";
export type Severity = "critical" | "high" | "medium" | "low";

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