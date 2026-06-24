export interface AIAnalysisResult {
  predictedCategory: string;
  predictedSubcategory?: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  sentiment: 'positive' | 'neutral' | 'negative' | 'angry';
  confidence: number;
  urgencyScore: number;
  slaRiskScore: number;
  businessImpactScore: number;
  estimatedResolutionMinutes: number;
  summary: string;
  explanation: string;
  suggestedTags: string[];
  suggestedTeamId?: string;
  riskFlags: string[];
  recommendedNextActions: string[];
}

export interface AgentScore {
  agentId: string;
  score: number;
  skillMatch: number;
  availability: number;
  workloadBalance: number;
  historicalSuccess: number;
  sectorExperience: number;
  slaFit: number;
  explanation: string;
}

export interface AssignmentRecommendation {
  requestId: string;
  recommendedAgentId: string;
  recommendedTeamId?: string;
  score: number;
  confidence: number;
  explanation: string;
  alternativeAgents: AgentScore[];
}

export interface DashboardOverview {
  totalOpenRequests: number;
  newRequestsToday: number;
  resolvedRequests: number;
  avgResponseTimeMinutes: number;
  slaBreachRisk: number;
  aiAutoAssignmentRate: number;
  customerSatisfactionScore: number;
  agentUtilization: number;
  requestVolumeTrend: { date: string; count: number }[];
  categoryDistribution: { category: string; count: number }[];
  priorityDistribution: { priority: string; count: number }[];
  recentActivity: ActivityItem[];
  insights: string[];
}

export interface ActivityItem {
  id: string;
  type: 'request_created' | 'request_assigned' | 'request_resolved' | 'ai_analysis' | 'escalated' | 'sla_breach' | 'automation_triggered';
  message: string;
  timestamp: string;
  requestId?: string;
  actorName?: string;
}

export interface AnalyticsTrend {
  date: string;
  value: number;
  metric: string;
}

export interface AgentPerformance {
  agentId: string;
  agentName: string;
  resolvedCount: number;
  avgResolutionTime: number;
  satisfactionScore: number;
  workload: number;
  utilization: number;
}
