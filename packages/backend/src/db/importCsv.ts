import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import { v4 as uuid } from 'uuid';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '..', '..', 'yoyo.db');
const csvPath = path.join(__dirname, '..', '..', '..', '..', 'customer_support_tickets_200k.csv');

// Priority mapping
const priorityMap: Record<string, string> = {
  'Urgent': 'critical', 'High': 'high', 'Medium': 'medium', 'Low': 'low'
};

// Status mapping
const statusMap: Record<string, string> = {
  'Open': 'new', 'In Progress': 'in_progress', 'Resolved': 'resolved',
  'Closed': 'closed', 'Pending Customer': 'waiting_customer'
};

// Channel mapping
const channelMap: Record<string, string> = {
  'Email': 'email', 'Phone': 'phone', 'Chat': 'chatbot',
  'Web Form': 'web', 'Social Media': 'web'
};

// Product → sector mapping
const sectorMap: Record<string, string> = {
  'Billing System': 'Finance', 'CRM Platform': 'Marketing',
  'E-commerce Store': 'Retail', 'Cloud Storage': 'Telecom',
  'Mobile App': 'Telecom', 'Analytics Dashboard': 'Marketing',
  'Web Portal': 'Telecom', 'Payment Gateway': 'Finance',
  'Subscription Service': 'Finance', 'API Service': 'Telecom'
};

// Sentiment based on satisfaction score
function getSentiment(score: number): string {
  if (score >= 4) return 'positive';
  if (score >= 2) return 'neutral';
  return 'negative';
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

async function main() {
  console.log('Starting CSV import...');

  // Check CSV exists
  if (!fs.existsSync(csvPath)) {
    console.error(`CSV not found at: ${csvPath}`);
    process.exit(1);
  }

  // Check if database exists — if so, use it (has tables), else run migrate
  const dbExists = fs.existsSync(dbPath);
  const sqlite = new Database(dbPath);
  sqlite.pragma('journal_mode = WAL');
  sqlite.pragma('foreign_keys = ON');
  sqlite.pragma('synchronous = OFF');
  sqlite.pragma('cache_size = -80000');

  if (!dbExists) {
    console.log('Database does not exist. Please run migrate first.');
    process.exit(1);
  }

  // Get total lines for progress
  const totalLines = 200;
  const BATCH_SIZE = 500;
  const STATUS_INTERVAL = 100;

  // ===== READ CSV DATA =====
  console.log('Reading CSV...');
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const lines = csvContent.split('\n');
  const headerLine = lines[0];
  console.log(`Total lines (incl. header): ${lines.length}`);

  // Parse headers
  const headers = parseCSVLine(headerLine);
  console.log('Headers:', headers);

  // Clear existing data (keep tables)
  console.log('Clearing existing data...');
  sqlite.exec(`
    DELETE FROM assignment_recommendations;
    DELETE FROM request_events;
    DELETE FROM ai_model_runs;
    DELETE FROM automation_executions;
    DELETE FROM automation_rules;
    DELETE FROM reports;
    DELETE FROM requests;
    DELETE FROM requests;
    DELETE FROM customers;
    DELETE FROM agents;
    DELETE FROM teams;
    DELETE FROM users;
    DELETE FROM organizations;
  `);

  // ===== CREATE OPERATIONAL DATA =====
  console.log('Creating operational data (users, teams, agents)...');

  // Users (for auth)
  const users = [
    { id: uuid(), name: 'Admin User', email: 'admin@yoyo.ai', password: 'admin', role: 'admin' },
    { id: uuid(), name: 'Manager User', email: 'manager@yoyo.ai', password: 'manager', role: 'manager' },
    { id: uuid(), name: 'Agent User', email: 'agent@yoyo.ai', password: 'agent', role: 'agent' },
    { id: uuid(), name: 'Analyst User', email: 'analyst@yoyo.ai', password: 'analyst', role: 'analyst' },
    { id: uuid(), name: 'Viewer User', email: 'viewer@yoyo.ai', password: 'viewer', role: 'viewer' },
  ];

  const insertUser = sqlite.prepare(
    'INSERT INTO users (id, name, email, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?, ?)'
  );
  for (const u of users) {
    insertUser.run(u.id, u.name, u.email, bcrypt.hashSync(u.password, 10), u.role, new Date().toISOString());
  }
  console.log(`  Created ${users.length} users`);

  // Teams (6 sector teams)
  const teamData = [
    { name: 'Logistics Operations', sector: 'Logistics' },
    { name: 'Telecom Infrastructure', sector: 'Telecom' },
    { name: 'Marketing & CRM', sector: 'Marketing' },
    { name: 'Finance & Billing', sector: 'Finance' },
    { name: 'Retail Operations', sector: 'Retail' },
    { name: 'Technology Support', sector: 'Technology' },
  ];
  const teams: { id: string; name: string; sector: string }[] = [];
  const insertTeam = sqlite.prepare(
    'INSERT INTO teams (id, name, description, sector_focus, escalation_level, created_at) VALUES (?, ?, ?, ?, ?, ?)'
  );
  for (const t of teamData) {
    const id = uuid();
    teams.push({ id, name: t.name, sector: t.sector });
    insertTeam.run(id, t.name, `${t.name} team`, t.sector, 1, new Date().toISOString());
  }
  console.log(`  Created ${teams.length} teams`);

  // Agents (8 agents spread across teams)
  const agentData = [
    { name: 'Zeynep Kaya', team: 'Finance & Billing', skills: '["Billing","Payment Systems","Finance"]', sectors: '["Finance"]' },
    { name: 'Emre Demir', team: 'Technology Support', skills: '["Technical Support","Bug Fixing","API Support"]', sectors: '["Technology"]' },
    { name: 'Ayse Yilmaz', team: 'Marketing & CRM', skills: '["CRM","Customer Relations","Marketing"]', sectors: '["Marketing"]' },
    { name: 'Can Arslan', team: 'Logistics Operations', skills: '["Logistics","Tracking","Supply Chain"]', sectors: '["Logistics"]' },
    { name: 'Lara Sahin', team: 'Telecom Infrastructure', skills: '["Network","Infrastructure","Cloud"]', sectors: '["Telecom"]' },
    { name: 'Kerem Aydin', team: 'Retail Operations', skills: '["Retail","E-commerce","Customer Service"]', sectors: '["Retail"]' },
    { name: 'Elif Korkmaz', team: 'Finance & Billing', skills: '["Accounting","Refunds","Billing"]', sectors: '["Finance"]' },
    { name: 'Mehmet Yildiz', team: 'Technology Support', skills: '["DevOps","Software","Security"]', sectors: '["Technology"]' },
  ];
  const agents: { id: string; name: string; teamId: string; sectors: string }[] = [];
  const insertAgentUser = sqlite.prepare(
    'INSERT INTO users (id, name, email, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?, ?)'
  );
  const insertAgent = sqlite.prepare(
    'INSERT INTO agents (id, user_id, team_id, role_title, skills, sectors, languages, availability_status, capacity, current_workload, avg_resolution_time, satisfaction_score, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  );
  for (const a of agentData) {
    const userId = uuid();
    const agentId = uuid();
    const team = teams.find(t => t.name === a.team);
    const email = a.name.toLowerCase().replace(/\s+/g, '.') + '@yoyo.ai';
    insertAgentUser.run(userId, a.name, email, bcrypt.hashSync('agent123', 10), 'agent', new Date().toISOString());
    agents.push({ id: agentId, name: a.name, teamId: team?.id || teams[0].id, sectors: a.sectors });
    insertAgent.run(agentId, userId, team?.id || teams[0].id, 'Support Agent', a.skills, a.sectors, '["Turkish","English"]', 'available', 15, 0, 0, 0, new Date().toISOString());
  }
  console.log(`  Created ${agents.length} agents`);

  // Organizations
  const insertOrg = sqlite.prepare('INSERT INTO organizations (id, name, sector, subscription_plan, created_at) VALUES (?, ?, ?, ?, ?)');
  insertOrg.run(uuid(), 'YOYO Operations', 'Technology', 'enterprise', new Date().toISOString());

  // ===== IMPORT CSV DATA =====
  console.log('\nImporting CSV data (200K records)...');

  // Customer dedup map: email → id
  const customerMap = new Map<string, string>();
  let customerCount = 0;
  let requestCount = 0;
  let skippedLines = 0;

  const insertCustomer = sqlite.prepare(
    'INSERT OR IGNORE INTO customers (id, name, email, company, tier, sector, consent_status, age, gender, tenure_months, previous_tickets, satisfaction_score, segment, region, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  );

  const insertRequest = sqlite.prepare(`
    INSERT INTO requests (id, title, description, customer_id, sector, channel, category, subcategory, priority, status, sentiment, tags, ai_confidence, estimated_resolution_time, resolved_at, created_at, updated_at, product, resolution_notes, region, operating_system, browser, language, issue_complexity_score, first_response_time_hours, sla_breached, assigned_agent_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertEvent = sqlite.prepare(
    'INSERT INTO request_events (id, request_id, event_type, old_value, new_value, actor_id, note, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  );

  // Batch helpers
  let customerBatch: any[][] = [];
  let requestBatch: any[][] = [];
  let eventBatch: any[][] = [];

  function flushBatches() {
    const insertCustomers = sqlite.transaction((batch: any[][]) => {
      for (const row of batch) insertCustomer.run(...row);
    });
    const insertRequests = sqlite.transaction((batch: any[][]) => {
      for (const row of batch) insertRequest.run(...row);
    });
    const insertEvents = sqlite.transaction((batch: any[][]) => {
      for (const row of batch) insertEvent.run(...row);
    });

    if (customerBatch.length > 0) {
      insertCustomers(customerBatch);
      customerBatch = [];
    }
    if (requestBatch.length > 0) {
      insertRequests(requestBatch);
      requestBatch = [];
    }
    if (eventBatch.length > 0) {
      insertEvents(eventBatch);
      eventBatch = [];
    }
  }

  const now = new Date().toISOString();
  let lastLog = 0;

  for (let i = 1; i < lines.length && requestCount < 200; i++) {
    const line = lines[i].trim();
    if (!line) { skippedLines++; continue; }

    const cols = parseCSVLine(line);
    if (cols.length < 30) { skippedLines++; continue; }

    const ticketId = cols[0];
    const custEmail = cols[2];
    const product = cols[3];
    const category = cols[4];
    const issueDesc = cols[5];
    const resolutionNotes = cols[6];
    const priority = priorityMap[cols[7]] || 'medium';
    const status = (cols[8] === 'Escalated' || cols[21] === 'Yes')
      ? (cols[21] === 'Yes' ? 'escalated' : 'in_progress')
      : (statusMap[cols[8]] || 'new');
    const channel = channelMap[cols[9]] || 'web';
    const region = cols[10];
    const custAge = parseInt(cols[11]) || null;
    const custGender = cols[12] || null;
    const subType = cols[13] || 'basic';
    const tenureMonths = parseInt(cols[14]) || null;
    const prevTickets = parseInt(cols[15]) || null;
    const satScore = parseFloat(cols[16]) || null;
    const firstRespTime = parseFloat(cols[17]) || null;
    const resTime = parseFloat(cols[18]) || null;
    const createdDate = cols[19] || now;
    const resolvedDate = cols[20] || null;
    const isEscalated = cols[21] === 'Yes' ? 1 : 0;
    const isSLABreached = cols[22] === 'Yes' ? 1 : 0;
    const os = cols[23] || null;
    const browser = cols[24] || null;
    const language = cols[25] || null;
    const complexity = parseFloat(cols[28]) || null;
    const segment = cols[29] || null;

    // Derive sector from product
    const sector = sectorMap[product] || 'Technology';

    // Tier mapping (subscription_type)
    const tierMap: Record<string, string> = {
      'Free': 'basic', 'Basic': 'basic', 'Premium': 'premium', 'Enterprise': 'enterprise'
    };
    const tier = tierMap[subType] || 'basic';

    // Generate title from issue description (first 100 chars)
    const title = issueDesc.length > 120 ? issueDesc.substring(0, 120) + '...' : issueDesc;

    // Sentiment from satisfaction score
    const sentiment = satScore ? getSentiment(satScore) : 'neutral';

    // Subcategory from product
    const subcategory = product;

    // Create or find customer
    let customerId = customerMap.get(custEmail);
    if (!customerId) {
      customerId = `CUST-${custEmail.split('@')[0]}`;
      customerMap.set(custEmail, customerId);

      const company = custEmail.split('@')[1]?.split('.')[0] || 'Unknown';

      customerBatch.push([
        customerId, cols[1], custEmail, company, tier, sector, 'granted',
        custAge, custGender, tenureMonths, prevTickets, satScore, segment, region, createdDate
      ]);
      customerCount++;
    }

    // Request ID from ticket_id
    const reqId = `REQ-${ticketId}`;

    // Random agent assignment (round-robin-ish using ticketId)
    const agentIdx = parseInt(ticketId) % agents.length;
    const assignedAgentId = agents[agentIdx]?.id || null;

    requestBatch.push([
      reqId, title, issueDesc, customerId, sector, channel, category, subcategory,
      priority, status, sentiment, '[]', null, resTime, resolvedDate,
      createdDate, createdDate, product, resolutionNotes, region, os, browser,
      language, complexity, firstRespTime, isSLABreached ? 1 : 0, assignedAgentId
    ]);
    requestCount++;

    // Add request event for created (batch it so FK is valid)
    if (requestCount % 50 === 0) {
      eventBatch.push([uuid(), reqId, 'created', null, 'new', 'system', 'Ticket created via import', createdDate]);
    }

    // Flush batches periodically
    if (customerBatch.length >= BATCH_SIZE || requestBatch.length >= BATCH_SIZE || eventBatch.length >= BATCH_SIZE) {
      flushBatches();
    }

    // Progress logging
    if (i % STATUS_INTERVAL === 0) {
      const pct = ((i / totalLines) * 100).toFixed(1);
      console.log(`  Progress: ${i}/${totalLines} (${pct}%) — ${customerCount} customers, ${requestCount} requests`);
    }
  }

  // Final flush
  flushBatches();
  console.log(`  Final: ${totalLines} lines processed — ${customerCount} customers, ${requestCount} requests`);

  // ===== CREATE AUTOMATION RULES =====
  console.log('\nCreating automation rules...');
  const insertRule = sqlite.prepare(
    'INSERT INTO automation_rules (id, name, description, conditions, actions, enabled, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
  );
  const rules = [
    { name: 'SLA Breach Escalation', desc: 'Escalate requests with SLA breach risk', conditions: '{"field":"sla_breached","op":"eq","value":true}', actions: '{"type":"escalate","team":"senior"}', enabled: 1 },
    { name: 'High Priority Auto-Assign', desc: 'Auto-assign urgent/critical to best agent', conditions: '{"field":"priority","op":"in","value":["critical","high"]}', actions: '{"type":"auto_assign","method":"best_match"}', enabled: 1 },
    { name: 'Negative Sentiment Alert', desc: 'Notify manager on negative sentiment', conditions: '{"field":"sentiment","op":"eq","value":"negative"}', actions: '{"type":"notify","target":"manager"}', enabled: 1 },
    { name: 'Escalated Ticket Monitor', desc: 'Monitor escalated tickets daily', conditions: '{"field":"status","op":"eq","value":"escalated"}', actions: '{"type":"monitor","interval":"24h"}', enabled: 1 },
  ];
  for (const r of rules) {
    insertRule.run(uuid(), r.name, r.desc, r.conditions, r.actions, r.enabled, now);
  }

  // ===== CREATE REPORTS =====
  console.log('Creating reports...');
  const insertReport = sqlite.prepare(
    'INSERT INTO reports (id, name, type, filters, generated_by, summary, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
  );
  const reports = [
    { name: 'Monthly SLA Compliance', type: 'sla', summary: 'Overall SLA compliance rate across all sectors and priorities.' },
    { name: 'Agent Performance Q2', type: 'performance', summary: 'Agent resolution rates, satisfaction scores, and workload distribution.' },
    { name: 'Category Distribution', type: 'category', summary: 'Request volume by category and sector.' },
  ];
  for (const r of reports) {
    insertReport.run(uuid(), r.name, r.type, '{}', 'system', r.summary, now);
  }

  // ===== CREATE AUDIT LOGS =====
  console.log('Creating audit logs...');
  const insertAudit = sqlite.prepare(
    'INSERT INTO audit_logs (id, actor_id, action, entity_type, entity_id, metadata, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
  );
  const actions = ['data_import', 'system_init', 'config_update', 'csv_import_200k'];
  for (const action of actions) {
    insertAudit.run(uuid(), 'system', action, 'system', null, '{}', now);
  }

  // ===== ANALYZE FOR PERFORMANCE =====
  console.log('\nOptimizing database...');
  sqlite.exec('ANALYZE;');

  // Count results
  const countCustomers = (sqlite.prepare('SELECT COUNT(*) as c FROM customers').get() as any).c;
  const countRequests = (sqlite.prepare('SELECT COUNT(*) as c FROM requests').get() as any).c;
  const countAgents = (sqlite.prepare('SELECT COUNT(*) as c FROM agents').get() as any).c;

  sqlite.close();

  console.log('\n========================================');
  console.log('Import complete!');
  console.log(`  Customers: ${countCustomers}`);
  console.log(`  Requests:  ${countRequests}`);
  console.log(`  Agents:    ${countAgents}`);
  console.log(`  Teams:     ${teams.length}`);
  console.log(`  Skipped:   ${skippedLines}`);
  console.log('========================================');
}

main().catch(console.error);
