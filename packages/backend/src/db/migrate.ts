import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '..', '..', 'yoyo.db');

const sqlite = new Database(dbPath);
sqlite.pragma('journal_mode = WAL');
sqlite.pragma('foreign_keys = ON');

const createTables = `
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT,
  role TEXT NOT NULL DEFAULT 'agent' CHECK(role IN ('admin','manager','agent','analyst','viewer','worker')),
  avatar_url TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS organizations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  sector TEXT NOT NULL,
  subscription_plan TEXT DEFAULT 'enterprise',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS customers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  company TEXT NOT NULL,
  tier TEXT DEFAULT 'basic' CHECK(tier IN ('basic','premium','enterprise')),
  sector TEXT NOT NULL,
  consent_status TEXT DEFAULT 'granted',
  age INTEGER,
  gender TEXT,
  tenure_months INTEGER,
  previous_tickets INTEGER,
  satisfaction_score REAL,
  segment TEXT,
  region TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS teams (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  sector_focus TEXT,
  escalation_level INTEGER DEFAULT 1,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS agents (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  team_id TEXT REFERENCES teams(id),
  role_title TEXT NOT NULL,
  skills TEXT NOT NULL,
  sectors TEXT NOT NULL,
  languages TEXT NOT NULL DEFAULT '["Turkish","English"]',
  availability_status TEXT DEFAULT 'available' CHECK(availability_status IN ('available','busy','away','offline')),
  capacity INTEGER DEFAULT 10,
  current_workload INTEGER DEFAULT 0,
  avg_resolution_time REAL DEFAULT 0,
  satisfaction_score REAL DEFAULT 0,
  resolved_tickets_count INTEGER DEFAULT 0,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS requests (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  customer_id TEXT REFERENCES customers(id),
  sector TEXT NOT NULL,
  channel TEXT DEFAULT 'web' CHECK(channel IN ('email','web','api','phone','chatbot')),
  category TEXT NOT NULL,
  subcategory TEXT,
  priority TEXT DEFAULT 'medium' CHECK(priority IN ('critical','high','medium','low')),
  status TEXT DEFAULT 'new' CHECK(status IN ('new','analyzing','assigned','in_progress','waiting_customer','escalated','resolved','closed')),
  sentiment TEXT DEFAULT 'neutral' CHECK(sentiment IN ('positive','neutral','negative','angry')),
  sla_deadline TEXT,
  assigned_agent_id TEXT REFERENCES agents(id),
  assigned_team_id TEXT REFERENCES teams(id),
  tags TEXT DEFAULT '[]',
  ai_confidence REAL,
  ai_summary TEXT,
  ai_explanation TEXT,
  estimated_resolution_time REAL,
  resolved_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  product TEXT,
  resolution_notes TEXT,
  region TEXT,
  operating_system TEXT,
  browser TEXT,
  language TEXT,
  issue_complexity_score REAL,
  first_response_time_hours REAL,
  sla_breached INTEGER
);

CREATE TABLE IF NOT EXISTS request_events (
  id TEXT PRIMARY KEY,
  request_id TEXT NOT NULL REFERENCES requests(id),
  event_type TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  actor_id TEXT,
  note TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS assignment_recommendations (
  id TEXT PRIMARY KEY,
  request_id TEXT NOT NULL REFERENCES requests(id),
  recommended_agent_id TEXT REFERENCES agents(id),
  recommended_team_id TEXT REFERENCES teams(id),
  score REAL,
  confidence REAL,
  explanation TEXT,
  alternative_agents TEXT DEFAULT '[]',
  accepted INTEGER,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS automation_rules (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  conditions TEXT NOT NULL,
  actions TEXT NOT NULL,
  enabled INTEGER DEFAULT 1,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS automation_executions (
  id TEXT PRIMARY KEY,
  rule_id TEXT REFERENCES automation_rules(id),
  request_id TEXT REFERENCES requests(id),
  status TEXT NOT NULL,
  log TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS reports (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  filters TEXT DEFAULT '{}',
  generated_by TEXT,
  summary TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  actor_id TEXT,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  metadata TEXT DEFAULT '{}',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS ai_model_runs (
  id TEXT PRIMARY KEY,
  model_name TEXT NOT NULL,
  input_snapshot TEXT DEFAULT '{}',
  output_snapshot TEXT DEFAULT '{}',
  confidence REAL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS request_comments (
  id TEXT PRIMARY KEY,
  request_id TEXT NOT NULL REFERENCES requests(id),
  author_id TEXT REFERENCES users(id),
  author_name TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TEXT NOT NULL
);
`;

sqlite.exec(createTables);

// Indexes for performance with large datasets
const indexes = `
CREATE INDEX IF NOT EXISTS idx_requests_status ON requests(status);
CREATE INDEX IF NOT EXISTS idx_requests_priority ON requests(priority);
CREATE INDEX IF NOT EXISTS idx_requests_sector ON requests(sector);
CREATE INDEX IF NOT EXISTS idx_requests_category ON requests(category);
CREATE INDEX IF NOT EXISTS idx_requests_created_at ON requests(created_at);
CREATE INDEX IF NOT EXISTS idx_requests_assigned_agent ON requests(assigned_agent_id);
CREATE INDEX IF NOT EXISTS idx_requests_sla_deadline ON requests(sla_deadline);
CREATE INDEX IF NOT EXISTS idx_requests_customer ON requests(customer_id);
CREATE INDEX IF NOT EXISTS idx_request_events_request ON request_events(request_id);
CREATE INDEX IF NOT EXISTS idx_agents_team ON agents(team_id);
CREATE INDEX IF NOT EXISTS idx_agents_user ON agents(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_assignment_recs_request ON assignment_recommendations(request_id);
CREATE INDEX IF NOT EXISTS idx_automation_exec_rule ON automation_executions(rule_id);
`;
sqlite.exec(indexes);

console.log('Database tables and indexes created successfully.');
sqlite.close();
