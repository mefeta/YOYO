export interface User {
  id: string; name: string; email: string; role: string; avatarUrl: string | null;
}

export interface Request {
  id: string; title: string; description: string; customerId: string | null;
  sector: string; channel: string; category: string; subcategory: string | null;
  priority: string; status: string; sentiment: string; slaDeadline: string | null;
  assignedAgentId: string | null; assignedTeamId: string | null;
  tags: string; aiConfidence: number | null; aiSummary: string | null;
  aiExplanation: string | null; estimatedResolutionTime: number | null;
  resolvedAt: string | null; createdAt: string; updatedAt: string;
  customerName?: string; customerCompany?: string; agentName?: string;
  events?: RequestEvent[]; recommendation?: AssignmentRecommendation;
}

export interface RequestEvent {
  id: string; requestId: string; eventType: string;
  oldValue: string | null; newValue: string | null;
  actorId: string | null; note: string | null; createdAt: string;
}

export interface Agent {
  id: string; userId: string | null; teamId: string | null;
  roleTitle: string; skills: string; sectors: string; languages: string;
  availabilityStatus: string; capacity: number; currentWorkload: number;
  avgResolutionTime: number; satisfactionScore: number;
  name?: string; email?: string; role?: string; teamName?: string;
  activeRequests?: Request[]; recentRequests?: Request[];
}

export interface Team {
  id: string; name: string; description: string | null;
  sectorFocus: string | null; escalationLevel: number;
  agentCount?: number; openRequestCount?: number;
  totalWorkload?: number; totalCapacity?: number;
  utilization?: number; avgSatisfaction?: number;
  agents?: Agent[];
}

export interface AssignmentRecommendation {
  id: string; requestId: string; recommendedAgentId: string | null;
  recommendedTeamId: string | null; score: number | null;
  confidence: number | null; explanation: string | null;
  alternativeAgents: string; accepted: boolean | null;
  recommendedAgentName?: string;
}

export interface AgentScore {
  agentId: string; agentName?: string; score: number;
  skillMatch: number; availability: number; workloadBalance: number;
  historicalSuccess: number; sectorExperience: number; slaFit: number;
  explanation: string;
}

export interface AIAnalysisResult {
  predictedCategory: string; predictedSubcategory?: string;
  priority: string; sentiment: string; confidence: number;
  urgencyScore: number; slaRiskScore: number; businessImpactScore: number;
  estimatedResolutionMinutes: number; summary: string; explanation: string;
  suggestedTags: string[]; suggestedTeamId?: string;
  riskFlags: string[]; recommendedNextActions: string[];
}

export interface AnalyticsOverview {
  totalOpenRequests: number; newRequestsToday: number;
  resolvedRequests: number; avgResponseTimeMinutes: number;
  totalAgents: number; busyAgents: number; agentUtilization: number;
  requestVolumeTrend: { date: string; count: number }[];
  categoryDistribution: { category: string; count: number }[];
  priorityDistribution: { priority: string; count: number }[];
  sectorDistribution: { sector: string; count: number }[];
  insights: string[];
}

export interface AutomationRule {
  id: string; name: string; description: string | null;
  conditions: string; actions: string; enabled: boolean | number;
  createdAt: string;
}

export interface Report {
  id: string; name: string; type: string; filters: string;
  generatedBy: string | null; summary: string | null; createdAt: string;
}

export interface Customer {
  id: string; name: string; email: string | null; company: string;
  tier: string; sector: string; consentStatus: string; createdAt: string;
}
