import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
export const users = sqliteTable('users', {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    email: text('email').notNull().unique(),
    passwordHash: text('password_hash'),
    role: text('role', { enum: ['admin', 'manager', 'agent', 'analyst', 'viewer'] }).notNull().default('agent'),
    avatarUrl: text('avatar_url'),
    createdAt: text('created_at').notNull(),
});
export const organizations = sqliteTable('organizations', {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    sector: text('sector').notNull(),
    subscriptionPlan: text('subscription_plan').default('enterprise'),
    createdAt: text('created_at').notNull(),
});
export const customers = sqliteTable('customers', {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    email: text('email'),
    company: text('company').notNull(),
    tier: text('tier', { enum: ['basic', 'premium', 'enterprise'] }).default('basic'),
    sector: text('sector').notNull(),
    consentStatus: text('consent_status').default('granted'),
    age: integer('age'),
    gender: text('gender'),
    tenureMonths: integer('tenure_months'),
    previousTickets: integer('previous_tickets'),
    satisfactionScore: real('satisfaction_score'),
    segment: text('segment'),
    region: text('region'),
    createdAt: text('created_at').notNull(),
});
export const teams = sqliteTable('teams', {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    description: text('description'),
    sectorFocus: text('sector_focus'),
    escalationLevel: integer('escalation_level').default(1),
    createdAt: text('created_at').notNull(),
});
export const agents = sqliteTable('agents', {
    id: text('id').primaryKey(),
    userId: text('user_id').references(() => users.id),
    teamId: text('team_id').references(() => teams.id),
    roleTitle: text('role_title').notNull(),
    skills: text('skills').notNull(), // JSON array
    sectors: text('sectors').notNull(), // JSON array
    languages: text('languages').notNull().default('["Turkish","English"]'),
    availabilityStatus: text('availability_status', { enum: ['available', 'busy', 'away', 'offline'] }).default('available'),
    capacity: integer('capacity').default(10),
    currentWorkload: integer('current_workload').default(0),
    avgResolutionTime: real('avg_resolution_time').default(0),
    satisfactionScore: real('satisfaction_score').default(0),
    createdAt: text('created_at').notNull(),
});
export const requests = sqliteTable('requests', {
    id: text('id').primaryKey(),
    title: text('title').notNull(),
    description: text('description').notNull(),
    customerId: text('customer_id').references(() => customers.id),
    sector: text('sector').notNull(),
    channel: text('channel', { enum: ['email', 'web', 'api', 'phone', 'chatbot'] }).default('web'),
    category: text('category').notNull(),
    subcategory: text('subcategory'),
    priority: text('priority', { enum: ['critical', 'high', 'medium', 'low'] }).default('medium'),
    status: text('status', { enum: ['new', 'analyzing', 'assigned', 'in_progress', 'waiting_customer', 'escalated', 'resolved', 'closed'] }).default('new'),
    sentiment: text('sentiment', { enum: ['positive', 'neutral', 'negative', 'angry'] }).default('neutral'),
    slaDeadline: text('sla_deadline'),
    assignedAgentId: text('assigned_agent_id').references(() => agents.id),
    assignedTeamId: text('assigned_team_id').references(() => teams.id),
    tags: text('tags').default('[]'), // JSON array
    aiConfidence: real('ai_confidence'),
    aiSummary: text('ai_summary'),
    aiExplanation: text('ai_explanation'),
    estimatedResolutionTime: real('estimated_resolution_time'),
    resolvedAt: text('resolved_at'),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
    // CSV-specific fields
    product: text('product'),
    resolutionNotes: text('resolution_notes'),
    region: text('region'),
    operatingSystem: text('operating_system'),
    browser: text('browser'),
    language: text('language'),
    issueComplexityScore: real('issue_complexity_score'),
    firstResponseTimeHours: real('first_response_time_hours'),
    slaBreached: integer('sla_breached', { mode: 'boolean' }),
});
export const requestEvents = sqliteTable('request_events', {
    id: text('id').primaryKey(),
    requestId: text('request_id').references(() => requests.id).notNull(),
    eventType: text('event_type').notNull(),
    oldValue: text('old_value'),
    newValue: text('new_value'),
    actorId: text('actor_id'),
    note: text('note'),
    createdAt: text('created_at').notNull(),
});
export const assignmentRecommendations = sqliteTable('assignment_recommendations', {
    id: text('id').primaryKey(),
    requestId: text('request_id').references(() => requests.id).notNull(),
    recommendedAgentId: text('recommended_agent_id').references(() => agents.id),
    recommendedTeamId: text('recommended_team_id').references(() => teams.id),
    score: real('score'),
    confidence: real('confidence'),
    explanation: text('explanation'),
    alternativeAgents: text('alternative_agents').default('[]'), // JSON
    accepted: integer('accepted', { mode: 'boolean' }),
    createdAt: text('created_at').notNull(),
});
export const automationRules = sqliteTable('automation_rules', {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    description: text('description'),
    conditions: text('conditions').notNull(), // JSON
    actions: text('actions').notNull(), // JSON
    enabled: integer('enabled', { mode: 'boolean' }).default(true),
    createdAt: text('created_at').notNull(),
});
export const automationExecutions = sqliteTable('automation_executions', {
    id: text('id').primaryKey(),
    ruleId: text('rule_id').references(() => automationRules.id),
    requestId: text('request_id').references(() => requests.id),
    status: text('status').notNull(),
    log: text('log'),
    createdAt: text('created_at').notNull(),
});
export const reports = sqliteTable('reports', {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    type: text('type').notNull(),
    filters: text('filters').default('{}'),
    generatedBy: text('generated_by'),
    summary: text('summary'),
    createdAt: text('created_at').notNull(),
});
export const auditLogs = sqliteTable('audit_logs', {
    id: text('id').primaryKey(),
    actorId: text('actor_id'),
    action: text('action').notNull(),
    entityType: text('entity_type').notNull(),
    entityId: text('entity_id'),
    metadata: text('metadata').default('{}'),
    createdAt: text('created_at').notNull(),
});
export const aiModelRuns = sqliteTable('ai_model_runs', {
    id: text('id').primaryKey(),
    modelName: text('model_name').notNull(),
    inputSnapshot: text('input_snapshot').default('{}'),
    outputSnapshot: text('output_snapshot').default('{}'),
    confidence: real('confidence'),
    createdAt: text('created_at').notNull(),
});
//# sourceMappingURL=schema.js.map