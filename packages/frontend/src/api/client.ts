const BASE = '/api';

let authToken: string | null = localStorage.getItem('yoyo_token');

export function setToken(token: string | null) {
  authToken = token;
  if (token) localStorage.setItem('yoyo_token', token);
  else localStorage.removeItem('yoyo_token');
}

export function getToken() {
  if (!authToken) {
    authToken = localStorage.getItem('yoyo_token');
  }
  return authToken;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

  const res = await fetch(`${BASE}${path}`, { ...options, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `Request failed: ${res.status}`);
  }
  return res.json();
}

// Auth
export const login = (email: string, password: string) =>
  request<{ token: string; user: any }>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });

export const getMe = () => request<any>('/auth/me');

// Requests
export const getRequests = (params?: Record<string, string>): Promise<any[]> => {
  const qs = params ? '?' + new URLSearchParams(params).toString() : '';
  return request<any[]>(`/requests${qs}`);
};

export const getRequestsWithTotal = async (params?: Record<string, string>): Promise<{ data: any[]; total: number }> => {
  const qs = params ? '?' + new URLSearchParams(params).toString() : '';
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BASE}/requests${qs}`, { headers });
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  const data = await res.json();
  const total = parseInt(res.headers.get('X-Total-Count') || '0');
  return { data, total };
};

export const getRequest = (id: string) => request<any>(`/requests/${id}`);

export const createRequest = (data: any) =>
  request<any>('/requests', { method: 'POST', body: JSON.stringify(data) });

export const analyzeRequest = (id: string) =>
  request<any>(`/requests/${id}/analyze`, { method: 'POST' });

export const assignRequest = (id: string, data: { agentId?: string; teamId?: string }) =>
  request<any>(`/requests/${id}/assign`, { method: 'POST', body: JSON.stringify(data) });

export const updateRequestStatus = (id: string, status: string) =>
  request<any>(`/requests/${id}/status`, { method: 'POST', body: JSON.stringify({ status }) });

// Comments
export const getComments = (requestId: string) => request<any[]>(`/requests/${requestId}/comments`);
export const addComment = (requestId: string, content: string) =>
  request<any>(`/requests/${requestId}/comments`, { method: 'POST', body: JSON.stringify({ content }) });

// AI
export const aiClassify = (title: string, description: string) =>
  request<any>('/ai/classify-request', { method: 'POST', body: JSON.stringify({ title, description }) });

export const aiRecommend = (data: any) =>
  request<any>('/ai/recommend-assignment', { method: 'POST', body: JSON.stringify(data) });

// Agents
export const getAgents = () => request<any[]>('/agents');
export const getAgent = (id: string) => request<any>(`/agents/${id}`);
export const getAgentPerformance = (id: string) => request<any>(`/agents/${id}/performance`);
export const createAgent = (data: any) =>
  request<any>('/agents', { method: 'POST', body: JSON.stringify(data) });

// Users (admin only)
export const createUser = (data: any) =>
  request<any>('/users', { method: 'POST', body: JSON.stringify(data) });
export const getUsers = () => request<any[]>('/users');

// Teams
export const getTeams = () => request<any[]>('/teams');
export const getTeam = (id: string) => request<any>(`/teams/${id}`);

// Analytics
export const getAnalyticsOverview = () => request<any>('/analytics/overview');
export const getAnalyticsTrends = () => request<any[]>('/analytics/trends');
export const getAnalyticsCategories = () => request<any>('/analytics/categories');
export const getSLA = () => request<any>('/analytics/sla');
export const getAgentUtilization = () => request<any[]>('/analytics/agent-utilization');
// Reports
export const getReports = () => request<any[]>('/reports');
export const getSLAReport = () => request<any>('/reports/sla');
export const getPerformanceReport = () => request<any>('/reports/performance');
export const generateReport = (data: any) =>
  request<any>('/reports/generate', { method: 'POST', body: JSON.stringify(data) });

// Automation
export const getAutomationRules = () => request<any[]>('/automation/rules');
export const createAutomationRule = (data: any) =>
  request<any>('/automation/rules', { method: 'POST', body: JSON.stringify(data) });
export const updateAutomationRule = (id: string, data: any) =>
  request<any>(`/automation/rules/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
export const deleteAutomationRule = (id: string) =>
  request<any>(`/automation/rules/${id}`, { method: 'DELETE' });
export const getAutomationExecutions = () => request<any[]>('/automation/executions');

