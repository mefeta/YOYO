import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuid } from 'uuid';
import bcrypt from 'bcryptjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '..', '..', 'yoyo.db');

// Run migration first to ensure tables exist
const { execSync } = await import('child_process');
execSync(`tsx ${path.join(__dirname, 'migrate.ts')}`, { stdio: 'inherit' });

const sqlite = new Database(dbPath);
sqlite.pragma('journal_mode = WAL');
sqlite.pragma('foreign_keys = ON');

const now = new Date();
const daysAgo = (d: number) => new Date(now.getTime() - d * 86400000).toISOString();
const hoursAgo = (h: number) => new Date(now.getTime() - h * 3600000).toISOString();
const minutesAgo = (m: number) => new Date(now.getTime() - m * 60000).toISOString();

// Clear existing data
const tables = ['ai_model_runs','audit_logs','reports','automation_executions','automation_rules','assignment_recommendations','request_events','requests','agents','teams','customers','organizations','users'];
for (const t of tables) sqlite.exec(`DELETE FROM ${t}`);

// === USERS ===
const users = [
  { id: uuid(), name: 'Admin User', email: 'admin@yoyo.ai', role: 'admin', avatar: null },
  { id: uuid(), name: 'Manager User', email: 'manager@yoyo.ai', role: 'manager', avatar: null },
  { id: uuid(), name: 'Agent User', email: 'agent@yoyo.ai', role: 'agent', avatar: null },
  { id: uuid(), name: 'Analyst User', email: 'analyst@yoyo.ai', role: 'analyst', avatar: null },
  { id: uuid(), name: 'Viewer User', email: 'viewer@yoyo.ai', role: 'viewer', avatar: null },
  { id: uuid(), name: 'Ali Ozturk', email: 'ali@yoyo.ai', role: 'agent', avatar: null },
  { id: uuid(), name: 'Fatma Yildiz', email: 'fatma@yoyo.ai', role: 'agent', avatar: null },
  { id: uuid(), name: 'Caner Aydin', email: 'caner@yoyo.ai', role: 'agent', avatar: null },
  { id: uuid(), name: 'Derya Arslan', email: 'derya@yoyo.ai', role: 'agent', avatar: null },
  { id: uuid(), name: 'Burak Celik', email: 'burak@yoyo.ai', role: 'agent', avatar: null },
  { id: uuid(), name: 'Selin Tekin', email: 'selin@yoyo.ai', role: 'agent', avatar: null },
  { id: uuid(), name: 'Ozan Korkmaz', email: 'ozan@yoyo.ai', role: 'agent', avatar: null },
  { id: uuid(), name: 'Irem Yalcin', email: 'irem@yoyo.ai', role: 'agent', avatar: null },
  { id: uuid(), name: 'Emre Gunes', email: 'emre@yoyo.ai', role: 'agent', avatar: null },
  { id: uuid(), name: 'Cemre Polat', email: 'cemre@yoyo.ai', role: 'agent', avatar: null },
];

const insertUser = sqlite.prepare('INSERT INTO users (id, name, email, password_hash, role, avatar_url, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)');
const hashPassword = (email: string) => bcrypt.hashSync(email.split('@')[0], 10);
for (const u of users) {
  insertUser.run(u.id, u.name, u.email, hashPassword(u.email), u.role, u.avatar, daysAgo(60));
}

// === ORGANIZATION ===
const orgId = uuid();
sqlite.prepare('INSERT INTO organizations (id, name, sector, subscription_plan, created_at) VALUES (?, ?, ?, ?, ?)').run(orgId, 'YOYO Demo Corp', 'Technology', 'enterprise', daysAgo(120));

// === TEAMS ===
const teams = [
  { id: uuid(), name: 'Logistics Operations', description: 'Logistics and cargo requests', sector: 'Logistics', level: 1 },
  { id: uuid(), name: 'Telecom Support', description: 'Telecommunication service requests', sector: 'Telecom', level: 1 },
  { id: uuid(), name: 'Marketing Team', description: 'Marketing campaign and approval processes', sector: 'Marketing', level: 1 },
  { id: uuid(), name: 'Finance Operations', description: 'Invoice, payment and accounting requests', sector: 'Finance', level: 2 },
  { id: uuid(), name: 'Retail Support', description: 'Retail store and customer support', sector: 'Retail', level: 1 },
  { id: uuid(), name: 'Healthcare Operations', description: 'Healthcare operations and patient services', sector: 'Healthcare', level: 2 },
];
const insertTeam = sqlite.prepare('INSERT INTO teams (id, name, description, sector_focus, escalation_level, created_at) VALUES (?, ?, ?, ?, ?, ?)');
for (const t of teams) insertTeam.run(t.id, t.name, t.description, t.sector, t.level, daysAgo(90));

// === AGENTS ===
const agentConfigs = [
  { userId: users[2].id, teamId: teams[0].id, role: 'Senior Logistics Specialist', skills: '["Logistics Management","Tracking","Customer Communication","SAP","Excel"]', sectors: '["Logistics","Retail"]', langs: '["Turkish","English"]', status: 'available', cap: 12, load: 0, avgTime: 2.1, satisfaction: 4.8 },
  { userId: users[5].id, teamId: teams[0].id, role: 'Operations Specialist', skills: '["Tracking","Delivery Management","Customer Service"]', sectors: '["Logistics"]', langs: '["Turkish"]', status: 'available', cap: 10, load: 0, avgTime: 3.2, satisfaction: 4.2 },
  { userId: users[6].id, teamId: teams[1].id, role: 'Technical Support Engineer', skills: '["Network Management","Field Installation","Fault Detection","Fiber Technologies"]', sectors: '["Telecom"]', langs: '["Turkish","English"]', status: 'busy', cap: 8, load: 0, avgTime: 4.5, satisfaction: 3.9 },
  { userId: users[7].id, teamId: teams[1].id, role: 'Telecom Specialist', skills: '["Customer Support","Billing Management","PBX Configuration","VoIP"]', sectors: '["Telecom","Finance"]', langs: '["Turkish","English"]', status: 'available', cap: 10, load: 0, avgTime: 2.8, satisfaction: 4.5 },
  { userId: users[8].id, teamId: teams[2].id, role: 'Marketing Coordinator', skills: '["Campaign Management","Social Media","Content Production","SEO","Google Ads"]', sectors: '["Marketing","Retail"]', langs: '["Turkish","English"]', status: 'available', cap: 10, load: 0, avgTime: 3.0, satisfaction: 4.6 },
  { userId: users[9].id, teamId: teams[2].id, role: 'Creative Designer', skills: '["Graphic Design","Video Production","Adobe Creative Suite","Brand Management"]', sectors: '["Marketing"]', langs: '["Turkish"]', status: 'available', cap: 8, load: 0, avgTime: 5.2, satisfaction: 4.3 },
  { userId: users[10].id, teamId: teams[3].id, role: 'Finance Analyst', skills: '["Accounting","Invoice Management","Tax Law","ERP","Risk Analysis"]', sectors: '["Finance"]', langs: '["Turkish","English"]', status: 'available', cap: 10, load: 0, avgTime: 3.5, satisfaction: 4.7 },
  { userId: users[11].id, teamId: teams[3].id, role: 'Accounting Specialist', skills: '["Payment Processing","Bank Reconciliation","Expense Management","Excel"]', sectors: '["Finance"]', langs: '["Turkish"]', status: 'away', cap: 10, load: 0, avgTime: 4.0, satisfaction: 4.0 },
  { userId: users[12].id, teamId: teams[4].id, role: 'Retail Support Specialist', skills: '["Store Operations","Return Management","Stock Tracking","Customer Relations"]', sectors: '["Retail","Logistics"]', langs: '["Turkish","English"]', status: 'available', cap: 10, load: 0, avgTime: 2.5, satisfaction: 4.4 },
  { userId: users[13].id, teamId: teams[5].id, role: 'Healthcare Operations Specialist', skills: '["Patient Records","Appointment Management","Medical Documentation","Patient Communication"]', sectors: '["Healthcare"]', langs: '["Turkish","English"]', status: 'available', cap: 10, load: 0, avgTime: 3.8, satisfaction: 4.9 },
  { userId: users[14].id, teamId: teams[0].id, role: 'Logistics Coordinator', skills: '["Fleet Management","Route Optimization","Tracking","Customer Communication","Logistics Software"]', sectors: '["Logistics","Retail"]', langs: '["Turkish","English"]', status: 'available', cap: 10, load: 0, avgTime: 2.7, satisfaction: 4.6 },
];

const insertAgent = sqlite.prepare('INSERT INTO agents (id, user_id, team_id, role_title, skills, sectors, languages, availability_status, capacity, current_workload, avg_resolution_time, satisfaction_score, resolved_tickets_count, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
const agents: { id: string; userId: string; teamId: string; }[] = [];
for (const a of agentConfigs) {
  const id = uuid();
  agents.push({ id, userId: a.userId!, teamId: a.teamId });
  insertAgent.run(id, a.userId, a.teamId, a.role, a.skills, a.sectors, a.langs, a.status, a.cap, a.load, a.avgTime, a.satisfaction, 0, daysAgo(80));
}

// === CUSTOMERS ===
const customerData = [
  { name: 'Mustafa Yildirim', company: 'Aras Logistics', tier: 'enterprise', sector: 'Logistics' },
  { name: 'Ayse Karahan', company: 'Trendyol Express', tier: 'enterprise', sector: 'Logistics' },
  { name: 'Mehmet Demirtas', company: 'Turkcell', tier: 'enterprise', sector: 'Telecom' },
  { name: 'Zeynep Aksoy', company: 'Vodafone TR', tier: 'premium', sector: 'Telecom' },
  { name: 'Ali Sen', company: 'Dogus Media Group', tier: 'enterprise', sector: 'Marketing' },
  { name: 'Elif Yilmazer', company: 'Publicis Turkey', tier: 'premium', sector: 'Marketing' },
  { name: 'Burak Korkmaz', company: 'Garanti BBVA', tier: 'enterprise', sector: 'Finance' },
  { name: 'Cemre Yalcin', company: 'Akbank', tier: 'enterprise', sector: 'Finance' },
  { name: 'Derya Ozkan', company: 'Migros', tier: 'enterprise', sector: 'Retail' },
  { name: 'Fatih Polat', company: 'LC Waikiki', tier: 'premium', sector: 'Retail' },
  { name: 'Gulsah Aydin', company: 'Acibadem Health', tier: 'enterprise', sector: 'Healthcare' },
  { name: 'Hakan Gunes', company: 'Medicana', tier: 'premium', sector: 'Healthcare' },
  { name: 'Irem Koc', company: 'Ekol Logistics', tier: 'premium', sector: 'Logistics' },
  { name: 'Kaan Aslan', company: 'Turk Telekom', tier: 'enterprise', sector: 'Telecom' },
  { name: 'Lale Cetin', company: 'MediaCat', tier: 'basic', sector: 'Marketing' },
  { name: 'Murat Ersoy', company: 'QNB Finansbank', tier: 'premium', sector: 'Finance' },
  { name: 'Nazli Simsek', company: 'Boyner', tier: 'basic', sector: 'Retail' },
  { name: 'Onur Yildiz', company: 'Beyaz Hospital', tier: 'basic', sector: 'Healthcare' },
  { name: 'Pinar Ates', company: 'MNG Cargo', tier: 'premium', sector: 'Logistics' },
  { name: 'Riza Can', company: 'Turknet', tier: 'basic', sector: 'Telecom' },
  { name: 'Sema Karatas', company: 'ReklamZ', tier: 'basic', sector: 'Marketing' },
  { name: 'Tolga Basar', company: 'Halkbank', tier: 'premium', sector: 'Finance' },
  { name: 'Umit Ozgur', company: 'CarrefourSA', tier: 'basic', sector: 'Retail' },
  { name: 'Volkan Eker', company: 'Medipol Health', tier: 'premium', sector: 'Healthcare' },
  { name: 'Yasemin Tuna', company: 'Kuehne+Nagel', tier: 'enterprise', sector: 'Logistics' },
];
const insertCustomer = sqlite.prepare('INSERT INTO customers (id, name, email, company, tier, sector, consent_status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
const customers: { id: string; name: string; company: string; sector: string; tier: string }[] = [];
for (const c of customerData) {
  const id = uuid();
  customers.push({ id, ...c });
  insertCustomer.run(id, c.name, `${c.name.toLowerCase().replace(/\s/g, '.')}@${c.company.toLowerCase().replace(/\s/g, '')}.com`, c.company, c.tier || 'basic', c.sector, 'granted', daysAgo(100));
}

// === REQUESTS ===
const requestTemplates = [
  // Logistics requests
  { title: 'Tracking number not updating', desc: 'The tracking number has not appeared in the system for 3 days. Our customer keeps complaining.', custIdx: 0, sector: 'Logistics', cat: 'Delivery Delay', sub: 'Tracking Issue', channel: 'web', priority: 'high', sentiment: 'negative', slaH: 24, status: 'assigned', agentIdx: 0, teamIdx: 0, tags: '["cargo","tracking","delay"]', conf: 87, explain: 'High priority logistics request. Tracking issue requires immediate action.' },
  { title: 'Delivery delayed for the third time', desc: 'Customer reports their order has been delayed for the third time and threatens to cancel the contract. Urgent action needed.', custIdx: 1, sector: 'Logistics', cat: 'Delivery Delay', sub: 'Repeated Delay', channel: 'email', priority: 'critical', sentiment: 'angry', slaH: 4, status: 'assigned', agentIdx: 0, teamIdx: 0, tags: '["delay","contract","critical"]', conf: 94, explain: 'Critical customer churn risk. Repeated delay requires management approval.' },
  { title: 'International shipment customs issue', desc: 'Package sent to Germany is stuck at customs. Please check the documents.', custIdx: 12, sector: 'Logistics', cat: 'Delivery Delay', sub: 'Customs', channel: 'email', priority: 'medium', sentiment: 'neutral', slaH: 48, status: 'in_progress', agentIdx: 10, teamIdx: 0, tags: '["customs","international","documents"]', conf: 76, explain: 'Medium priority customs request. Document check required.' },
  { title: 'Delivery address change', desc: 'Customer wants to change the delivery address. Shipment has not been dispatched yet.', custIdx: 18, sector: 'Logistics', cat: 'Delivery Delay', sub: 'Address Change', channel: 'phone', priority: 'low', sentiment: 'positive', slaH: 72, status: 'new', agentIdx: null, teamIdx: 0, tags: '["address","delivery"]', conf: 72, explain: 'Low priority, standard address update request.' },
  { title: 'Bulk shipment planning', desc: 'We need to prepare a bulk shipping agreement for 5000+ monthly orders.', custIdx: 24, sector: 'Logistics', cat: 'Contract Update', sub: 'Bulk Shipping', channel: 'api', priority: 'high', sentiment: 'positive', slaH: 36, status: 'new', agentIdx: null, teamIdx: 0, tags: '["shipment","agreement","bulk"]', conf: 81, explain: 'High volume logistics contract request, experienced team recommended.' },

  // Telecom requests
  { title: 'Fiber internet outage - Downtown', desc: 'Widespread fiber internet outage in downtown area. 200+ subscribers affected.', custIdx: 2, sector: 'Telecom', cat: 'Outage Report', sub: 'Fiber', channel: 'api', priority: 'critical', sentiment: 'negative', slaH: 2, status: 'escalated', agentIdx: 2, teamIdx: 1, tags: '["outage","fiber","downtown"]', conf: 96, explain: 'Critical outage with widespread impact. Field team dispatch needed urgently.' },
  { title: 'Billing dispute - incorrect charges', desc: 'Customer claims they were charged for a service they did not order. Please review invoice details.', custIdx: 3, sector: 'Telecom', cat: 'Billing Problem', sub: 'Invoice Dispute', channel: 'web', priority: 'high', sentiment: 'angry', slaH: 12, status: 'in_progress', agentIdx: 3, teamIdx: 1, tags: '["invoice","charge","dispute"]', conf: 89, explain: 'High priority billing dispute. Customer satisfaction at risk.' },
  { title: 'Number porting request', desc: 'Customer wants to switch to Turkcell from their current operator. Will apply for number porting.', custIdx: 13, sector: 'Telecom', cat: 'Contract Update', sub: 'Number Porting', channel: 'phone', priority: 'medium', sentiment: 'positive', slaH: 48, status: 'assigned', agentIdx: 3, teamIdx: 1, tags: '["number","porting","transfer"]', conf: 78, explain: 'Standard number porting request, medium priority.' },
  { title: 'PBX configuration support', desc: 'We need PBX setup and configuration for a newly opened office. 20 internal extensions.', custIdx: 19, sector: 'Telecom', cat: 'Technical Failure', sub: 'PBX Setup', channel: 'email', priority: 'medium', sentiment: 'neutral', slaH: 48, status: 'new', agentIdx: null, teamIdx: 1, tags: '["pbx","setup","configuration"]', conf: 73, explain: 'Medium priority technical setup request.' },
  { title: 'Mobile line activation issue', desc: 'New mobile line has not been active for 48 hours. Customer is frustrated.', custIdx: 3, sector: 'Telecom', cat: 'Technical Failure', sub: 'Activation', channel: 'web', priority: 'high', sentiment: 'negative', slaH: 12, status: 'in_progress', agentIdx: 2, teamIdx: 1, tags: '["mobile","activation","line"]', conf: 84, explain: 'High priority, line activation delay affecting customer satisfaction.' },

  // Marketing requests
  { title: 'Q3 campaign approval', desc: 'Requires manager approval for Q3 digital campaign budget and creative concept.', custIdx: 4, sector: 'Marketing', cat: 'Campaign Approval', sub: 'Budget Approval', channel: 'email', priority: 'high', sentiment: 'positive', slaH: 36, status: 'assigned', agentIdx: 4, teamIdx: 2, tags: '["campaign","approval","q3","budget"]', conf: 85, explain: 'High priority campaign approval process requires marketing coordination.' },
  { title: 'Social media crisis management', desc: 'Negative news spreading about our brand on social media. We need an urgent crisis communication plan.', custIdx: 5, sector: 'Marketing', cat: 'Customer Complaint', sub: 'Social Media Crisis', channel: 'web', priority: 'critical', sentiment: 'negative', slaH: 3, status: 'escalated', agentIdx: 5, teamIdx: 2, tags: '["socialmedia","crisis","pr"]', conf: 92, explain: 'Critical crisis communication. Immediate action required.' },
  { title: 'New product launch brief', desc: 'Need a creative brief prepared for the new product launching next month.', custIdx: 14, sector: 'Marketing', cat: 'Campaign Approval', sub: 'Creative Brief', channel: 'email', priority: 'medium', sentiment: 'positive', slaH: 72, status: 'new', agentIdx: null, teamIdx: 2, tags: '["launch","brief","creative"]', conf: 70, explain: 'Standard launch brief request.' },
  { title: 'SEO performance report request', desc: 'We request a detailed report showing last quarter SEO performance.', custIdx: 5, sector: 'Marketing', cat: 'Data Request', sub: 'SEO Report', channel: 'web', priority: 'low', sentiment: 'neutral', slaH: 96, status: 'new', agentIdx: null, teamIdx: 2, tags: '["seo","report","performance"]', conf: 68, explain: 'Low priority standard report request.' },

  // Finance requests
  { title: 'Bulk payment error - EFT failed', desc: '23 employee EFT transactions failed during bulk salary payments. Transaction details attached.', custIdx: 6, sector: 'Finance', cat: 'Technical Failure', sub: 'Payment Error', channel: 'api', priority: 'critical', sentiment: 'angry', slaH: 2, status: 'in_progress', agentIdx: 6, teamIdx: 3, tags: '["payment","error","failed"]', conf: 95, explain: 'Critical payment error. Financial transaction requires urgent resolution.' },
  { title: 'Invoice correction request', desc: 'There is a calculation error on the issued invoice. Needs a corrected invoice.', custIdx: 7, sector: 'Finance', cat: 'Billing Problem', sub: 'Invoice Correction', channel: 'web', priority: 'high', sentiment: 'negative', slaH: 18, status: 'assigned', agentIdx: 7, teamIdx: 3, tags: '["invoice","correction","amount"]', conf: 83, explain: 'High priority invoice correction requires accounting approval.' },
  { title: 'Annual tax declaration consulting', desc: 'We request financial consulting services for corporate tax declaration preparation.', custIdx: 15, sector: 'Finance', cat: 'Compliance Question', sub: 'Tax Declaration', channel: 'email', priority: 'high', sentiment: 'neutral', slaH: 72, status: 'new', agentIdx: null, teamIdx: 3, tags: '["tax","declaration","consulting"]', conf: 79, explain: 'High priority tax consulting request.' },
  { title: 'Credit application assessment', desc: 'Request for financial assessment report for commercial credit application.', custIdx: 22, sector: 'Finance', cat: 'Data Request', sub: 'Credit Assessment', channel: 'email', priority: 'medium', sentiment: 'positive', slaH: 48, status: 'new', agentIdx: null, teamIdx: 3, tags: '["credit","assessment","report"]', conf: 74, explain: 'Medium priority credit assessment request.' },

  // Retail requests
  { title: 'Stock count discrepancy - 150 units missing', desc: 'Warehouse count shows 150 units missing. Urgent physical count and reporting needed.', custIdx: 8, sector: 'Retail', cat: 'Technical Failure', sub: 'Inventory Issue', channel: 'api', priority: 'high', sentiment: 'negative', slaH: 12, status: 'in_progress', agentIdx: 8, teamIdx: 4, tags: '["stock","count","shortage"]', conf: 86, explain: 'High priority stock issue requires physical verification.' },
  { title: 'Online return process inquiry', desc: 'Customer wants to return a product purchased online but does not know the process. Please guide them.', custIdx: 9, sector: 'Retail', cat: 'Refund Request', sub: 'Return Process', channel: 'phone', priority: 'low', sentiment: 'neutral', slaH: 72, status: 'assigned', agentIdx: 8, teamIdx: 4, tags: '["return","online","guidance"]', conf: 65, explain: 'Low priority standard return information request.' },
  { title: 'Store opening operational support', desc: 'We need operational support and team setup for our new mall branch opening.', custIdx: 16, sector: 'Retail', cat: 'Contract Update', sub: 'Store Opening', channel: 'email', priority: 'medium', sentiment: 'positive', slaH: 96, status: 'new', agentIdx: null, teamIdx: 4, tags: '["store","opening","operations"]', conf: 71, explain: 'Medium priority store opening support.' },
  { title: 'Supplier price update', desc: 'Our supplier sent a new price list. Requires approval for contract update.', custIdx: 22, sector: 'Retail', cat: 'Contract Update', sub: 'Supplier', channel: 'email', priority: 'high', sentiment: 'neutral', slaH: 36, status: 'new', agentIdx: null, teamIdx: 4, tags: '["supplier","price","update"]', conf: 80, explain: 'High priority supplier contract update.' },

  // Healthcare requests
  { title: 'Patient record data inconsistency', desc: 'Data inconsistency found in 45 patient records in the HMS system. Data cleanup required.', custIdx: 10, sector: 'Healthcare', cat: 'Technical Failure', sub: 'Data Inconsistency', channel: 'api', priority: 'critical', sentiment: 'negative', slaH: 6, status: 'escalated', agentIdx: 9, teamIdx: 5, tags: '["database","data","patient","critical"]', conf: 93, explain: 'Critical data inconsistency with patient safety risk. Immediate action.' },
  { title: 'Appointment system performance issue', desc: 'Online appointment system is slow during peak hours and timing out.', custIdx: 11, sector: 'Healthcare', cat: 'Technical Failure', sub: 'Performance', channel: 'web', priority: 'high', sentiment: 'negative', slaH: 24, status: 'in_progress', agentIdx: 9, teamIdx: 5, tags: '["appointment","performance","system"]', conf: 82, explain: 'High priority system performance issue.' },
  { title: 'Patient satisfaction survey results', desc: 'We need to analyze and report monthly patient satisfaction survey results.', custIdx: 23, sector: 'Healthcare', cat: 'Data Request', sub: 'Survey Analysis', channel: 'email', priority: 'medium', sentiment: 'positive', slaH: 72, status: 'new', agentIdx: null, teamIdx: 5, tags: '["survey","satisfaction","analysis"]', conf: 67, explain: 'Medium priority standard analysis request.' },
  { title: 'Medical device maintenance request', desc: 'MRI machine periodic maintenance is due. Please dispatch technical team.', custIdx: 17, sector: 'Healthcare', cat: 'Technical Failure', sub: 'Equipment Maintenance', channel: 'phone', priority: 'high', sentiment: 'neutral', slaH: 36, status: 'new', agentIdx: null, teamIdx: 5, tags: '["mri","maintenance","medical"]', conf: 77, explain: 'High priority medical device maintenance request.' },

  // More mixed requests
  { title: 'SLA breach report preparation', desc: 'Need a detailed report showing last month SLA performance.', custIdx: 6, sector: 'Finance', cat: 'Data Request', sub: 'SLA Report', channel: 'email', priority: 'medium', sentiment: 'neutral', slaH: 48, status: 'new', agentIdx: null, teamIdx: 3, tags: '["sla","report","performance"]', conf: 73, explain: 'Medium priority SLA report request.' },
  { title: 'GDPR data deletion request', desc: 'Customer requests deletion of all their data under GDPR regulations. Legal process must be initiated.', custIdx: 15, sector: 'Finance', cat: 'Compliance Question', sub: 'GDPR', channel: 'email', priority: 'high', sentiment: 'negative', slaH: 72, status: 'new', agentIdx: null, teamIdx: 3, tags: '["gdpr","data","deletion","legal"]', conf: 88, explain: 'High priority GDPR compliance request. Legal process must be initiated.' },
  { title: 'Campaign performance evaluation', desc: 'We request ROI analysis and performance report for June campaigns.', custIdx: 4, sector: 'Marketing', cat: 'Data Request', sub: 'Campaign Analytics', channel: 'web', priority: 'medium', sentiment: 'positive', slaH: 72, status: 'new', agentIdx: null, teamIdx: 2, tags: '["campaign","roi","analysis"]', conf: 72, explain: 'Medium priority campaign analysis request.' },
];

const insertRequest = sqlite.prepare('INSERT INTO requests (id, title, description, customer_id, sector, channel, category, subcategory, priority, status, sentiment, sla_deadline, assigned_agent_id, assigned_team_id, tags, ai_confidence, ai_summary, ai_explanation, estimated_resolution_time, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
const insertEvent = sqlite.prepare('INSERT INTO request_events (id, request_id, event_type, old_value, new_value, actor_id, note, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
const insertRec = sqlite.prepare('INSERT INTO assignment_recommendations (id, request_id, recommended_agent_id, recommended_team_id, score, confidence, explanation, alternative_agents, accepted, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');

// Generate resolved requests too
const resolvedRequests: typeof requestTemplates = [];
for (let i = 0; i < 15; i++) {
  const tpl = requestTemplates[i % requestTemplates.length];
  resolvedRequests.push({ ...tpl, status: 'resolved' as const });
}

const allRequests = [...requestTemplates, ...resolvedRequests];

for (let i = 0; i < allRequests.length; i++) {
  const r = allRequests[i];
  const cust = customers[r.custIdx % customers.length];
  const reqId = `REQ-${String(i + 1).padStart(4, '0')}`;
  const isResolved = r.status === 'resolved';
  const created = isResolved ? daysAgo(Math.floor(Math.random() * 10) + 5) : i < 3 ? hoursAgo(i + 1) : daysAgo(Math.floor(Math.random() * 5));
  const slaDate = new Date(new Date(created).getTime() + (r.slaH || 24) * 3600000);
  const resolvedAt = isResolved ? new Date(new Date(created).getTime() + (Math.random() * 12 + 2) * 3600000).toISOString() : null;

  insertRequest.run(
    reqId, r.title, r.desc, cust.id, r.sector, r.channel, r.cat, r.sub || null,
    r.priority, r.status, r.sentiment, slaDate.toISOString(),
    r.agentIdx !== null ? agents[r.agentIdx].id : null,
    r.teamIdx !== null ? teams[r.teamIdx].id : null,
    r.tags, r.conf, `${r.cat} - ${r.sub || r.sector}`, r.explain,
    Math.floor(Math.random() * 240 + 30),
    created, isResolved ? resolvedAt : new Date().toISOString()
  );

  // Events
  insertEvent.run(uuid(), reqId, 'created', null, 'new', users[0].id, 'Request created', created);
  if (r.status !== 'new') {
    insertEvent.run(uuid(), reqId, 'ai_analyzed', null, r.cat, null, `AI analysis: ${r.cat} - ${r.conf}% confidence`, hoursAgo(Math.floor(Math.random() * 12) + 1));
    insertEvent.run(uuid(), reqId, 'status_change', 'new', 'analyzing', null, 'AI analysis started', hoursAgo(Math.floor(Math.random() * 12) + 1));
  }
  if (r.agentIdx !== null) {
    const agent = agents[r.agentIdx];
    insertEvent.run(uuid(), reqId, 'status_change', 'analyzing', 'assigned', users[1].id, `Assigned: ${agentConfigs[r.agentIdx].role}`, hoursAgo(Math.floor(Math.random() * 10) + 1));
    insertEvent.run(uuid(), reqId, 'assigned', null, agent.id, users[1].id, 'Assigned via AI recommendation', hoursAgo(Math.floor(Math.random() * 10) + 1));

    // Assignment recommendation
    const altAgents = agents.filter(a => a.id !== agent.id).slice(0, 3).map(a => {
      const agentUser = users.find(u => u.id === a.userId);
      return {
        agentId: a.id,
        agentName: agentUser?.name || 'Unknown',
        score: Math.round((Math.random() * 30 + 50)),
        skillMatch: Math.round(Math.random() * 30 + 60),
        availability: Math.round(Math.random() * 30 + 60),
        workloadBalance: Math.round(Math.random() * 30 + 60),
        historicalSuccess: Math.round(Math.random() * 30 + 60),
        sectorExperience: Math.round(Math.random() * 30 + 60),
        slaFit: Math.round(Math.random() * 30 + 60),
        explanation: 'Alternative assignment evaluation',
      };
    });
    const team = teams[r.teamIdx];
    if (!team) throw new Error(`No team at index ${r.teamIdx} for request ${reqId}`);
    insertRec.run(uuid(), reqId, agent.id, team.id,
      Math.round(Math.random() * 20 + 75), r.conf, r.explain,
      JSON.stringify(altAgents), 1, hoursAgo(Math.floor(Math.random() * 10) + 1));
  }
  if (r.status === 'in_progress') {
    insertEvent.run(uuid(), reqId, 'status_change', 'assigned', 'in_progress', r.agentIdx !== null ? agents[r.agentIdx].userId : null, 'Work started', hoursAgo(Math.floor(Math.random() * 6) + 1));
  }
  if (r.status === 'escalated') {
    insertEvent.run(uuid(), reqId, 'status_change', 'in_progress', 'escalated', users[1].id, 'Critical level - escalated to management', hoursAgo(Math.floor(Math.random() * 3) + 1));
  }
  if (isResolved && resolvedAt) {
    insertEvent.run(uuid(), reqId, 'status_change', 'in_progress', 'resolved', r.agentIdx !== null ? agents[r.agentIdx].userId : null, 'Request resolved', resolvedAt);
  }
}

// === AUTOMATION RULES ===
const ruleData = [
  { name: 'Critical SLA Breach Escalation', desc: 'Escalate critical priority and high SLA risk requests to senior team', conds: JSON.stringify({ priority: 'critical', slaRisk: 'high' }), acts: JSON.stringify({ action: 'escalate_to_senior', notify: ['manager'] }), enabled: true },
  { name: 'Negative Sentiment Notification', desc: 'Notify manager on negative sentiment with enterprise customers', conds: JSON.stringify({ sentiment: 'negative', customerTier: 'enterprise' }), acts: JSON.stringify({ action: 'notify_manager', priority: 'high' }), enabled: true },
  { name: 'Billing Request Routing', desc: 'Route billing category requests to Finance Operations team', conds: JSON.stringify({ category: 'Billing Problem' }), acts: JSON.stringify({ action: 'route_to_team', team: 'Finance Operations' }), enabled: true },
  { name: 'Overload Warning', desc: 'Block new assignment when agent workload exceeds 90%', conds: JSON.stringify({ agentWorkload: '>90' }), acts: JSON.stringify({ action: 'block_assignment', notify: ['team_lead'] }), enabled: false },
  { name: 'Pending Request Reminder', desc: 'Send reminder for requests waiting customer response for 4+ hours', conds: JSON.stringify({ status: 'waiting_customer', duration_hours: 4 }), acts: JSON.stringify({ action: 'send_reminder', channel: 'email' }), enabled: true },
];
const insertRule = sqlite.prepare('INSERT INTO automation_rules (id, name, description, conditions, actions, enabled, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)');
for (const r of ruleData) insertRule.run(uuid(), r.name, r.desc, r.conds, r.acts, r.enabled ? 1 : 0, daysAgo(45));

// === REPORTS ===
const reportData = [
  { name: 'Monthly Operational Performance Report', type: 'operational_performance', summary: '47 requests opened this month, 38 resolved. Average resolution time 3.2 hours. AI assignment rate: 84%.' },
  { name: 'Weekly SLA Compliance Report', type: 'sla_compliance', summary: 'SLA compliance rate: 92%. Highest breach rate in Telecom sector (8%).' },
  { name: 'Q2 Request Volume Analysis', type: 'request_volume', summary: 'Q2 request volume increased by 18% compared to previous quarter. Logistics sector contributed the most.' },
  { name: 'Agent Performance Evaluation', type: 'agent_performance', summary: 'Top performer: Agent User (96% satisfaction, 2.1h avg resolution).' },
  { name: 'Customer Satisfaction Report', type: 'customer_satisfaction', summary: 'Overall satisfaction score: 4.3/5.0. Most satisfied sector: Healthcare (4.7).' },
];
const insertReport = sqlite.prepare('INSERT INTO reports (id, name, type, filters, generated_by, summary, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)');
for (const r of reportData) {
  insertReport.run(uuid(), r.name, r.type, '{}', users[3].id, r.summary, daysAgo(Math.floor(Math.random() * 15) + 1));
}

// === AUDIT LOGS ===
for (let i = 0; i < 30; i++) {
  const actions = ['request.created', 'request.assigned', 'request.status_changed', 'ai.analysis', 'user.login', 'settings.updated', 'rule.created', 'report.generated'];
  const action = actions[Math.floor(Math.random() * actions.length)];
  sqlite.prepare('INSERT INTO audit_logs (id, actor_id, action, entity_type, entity_id, metadata, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
    uuid(), users[Math.floor(Math.random() * users.length)].id, action, action.split('.')[0], `REQ-${String(Math.floor(Math.random() * 30) + 1).padStart(4, '0')}`, '{}', hoursAgo(Math.floor(Math.random() * 72))
  );
}

// === AI MODEL RUNS ===
const modelNames = ['demand_forecast', 'sla_risk', 'agent_recommendation', 'sentiment_classification', 'category_classification'];
for (let i = 0; i < 20; i++) {
  const model = modelNames[Math.floor(Math.random() * modelNames.length)];
  const conf = Math.round((Math.random() * 15 + 80) * 10) / 10;
  sqlite.prepare('INSERT INTO ai_model_runs (id, model_name, input_snapshot, output_snapshot, confidence, created_at) VALUES (?, ?, ?, ?, ?, ?)').run(
    uuid(), model, '{"sample":"data"}', '{"result":"simulated"}', conf, hoursAgo(Math.floor(Math.random() * 72))
  );
}


// === DYNAMIC WORKLOAD CALCULATION (PART 3) ===
for (let i = 0; i < agents.length; i++) {
  const agentId = agents[i].id;
  const activeCount = (sqlite.prepare(
    `SELECT COUNT(*) as c FROM requests WHERE assigned_agent_id = ? AND status NOT IN ('resolved', 'closed')`
  ).get(agentId) as any)?.c || 0;
  const resolvedCount = (sqlite.prepare(
    `SELECT COUNT(*) as c FROM requests WHERE assigned_agent_id = ? AND status = 'resolved'`
  ).get(agentId) as any)?.c || 0;
  sqlite.prepare('UPDATE agents SET current_workload = ?, resolved_tickets_count = ? WHERE id = ?').run(activeCount, resolvedCount, agentId);
}

sqlite.close();
console.log('✅ Database seeded successfully!');
console.log('📊 Users: 15');
console.log('📊 Teams: 6');
console.log('📊 Agents: 11');
console.log('📊 Customers: 25');
console.log('📊 Requests: ' + allRequests.length);
console.log('📊 Automation Rules: 5');
console.log('📊 Reports: 5');
console.log('📊 Audit Logs: 30');
console.log('📊 AI Model Runs: 20');

console.log('');
console.log('🔑 Demo Credentials:');
console.log('   admin@yoyo.ai / admin');
console.log('   manager@yoyo.ai / manager');
console.log('   agent@yoyo.ai / agent');
console.log('   analyst@yoyo.ai / analyst');
console.log('   viewer@yoyo.ai / viewer');

