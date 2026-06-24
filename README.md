# YOYO — Yeni Nesil Operasyonel Yönetim Otomasyonu

**Next Generation Operational Management Automation**

YOYO is an AI-powered operational management platform that helps enterprises automatically receive, classify, prioritize, assign, track, analyze, and report service/customer/operation requests across multiple sectors including Logistics, Telecom, Marketing, Finance, Retail, and Healthcare.

## Demo Credentials

| Email | Password | Role |
|-------|----------|------|
| admin@yoyo.ai | admin | Admin |
| manager@yoyo.ai | manager | Operations Manager |
| agent@yoyo.ai | agent | Agent |
| analyst@yoyo.ai | analyst | Analyst |
| viewer@yoyo.ai | viewer | Viewer |

## Tech Stack

### Frontend
- **React 19 + TypeScript** with Vite
- **Tailwind CSS v4** — utility-first CSS with custom "Signal Command" dark theme
- **Framer Motion** — purposeful animations and micro-interactions
- **Recharts** — data visualization and analytics charts
- **Zustand** — lightweight state management
- Sora + IBM Plex Mono typography

### Backend
- **Node.js + Express + TypeScript**
- **SQLite** via better-sqlite3 (zero-configuration database)
- **Drizzle ORM** — type-safe database access
- Modular service architecture with clean route/controller separation

### AI/ML Layer
- Keyword-based NLP classification engine
- Multi-factor agent scoring system
- Explainable AI decisions with confidence metrics
- Modular architecture — swap with real ML models via API

## Quick Start

### Prerequisites
- Node.js 20+
- npm

### Installation

```bash
# Install root dependencies
npm install

# Install backend dependencies
cd packages/backend && npm install

# Install frontend dependencies
cd ../frontend && npm install
```

### Database Setup

```bash
# Run migration and seed data (from packages/backend)
npx tsx src/db/seed.ts
```

### Run the Application

```bash
# From root directory — starts both backend and frontend
npm run dev

# Or separately:
# Terminal 1: Backend
cd packages/backend && npx tsx src/index.ts

# Terminal 2: Frontend
cd packages/frontend && npx vite
```

- Backend: http://localhost:3001
- Frontend: http://localhost:5173

## Architecture

```
packages/
├── backend/
│   ├── src/
│   │   ├── db/
│   │   │   ├── schema.ts      # Database schema (Drizzle ORM)
│   │   │   ├── migrate.ts     # Table creation
│   │   │   ├── seed.ts        # Realistic seed data
│   │   │   └── index.ts       # Database connection
│   │   ├── routes/
│   │   │   ├── auth.ts        # Authentication endpoints
│   │   │   ├── requests.ts    # CRUD + AI analysis + assignment
│   │   │   ├── agents.ts      # Agent management + performance
│   │   │   ├── teams.ts       # Team management
│   │   │   ├── analytics.ts   # Dashboard + trends + predictions
│   │   │   ├── reports.ts     # Report generation
│   │   │   ├── ai.ts          # AI classification + recommendations
│   │   │   ├── automation.ts  # Workflow automation
│   │   │   ├── integrations.ts # External system connections
│   │   │   └── compliance.ts  # Audit logs + GDPR
│   │   ├── services/
│   │   │   └── aiService.ts   # AI simulation engine
│   │   ├── types/index.ts     # TypeScript interfaces
│   │   └── index.ts           # Express server entry
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── api/client.ts      # API client with auth
    │   ├── store/appStore.ts  # Zustand state
    │   ├── types/index.ts     # Frontend types
    │   ├── components/
    │   │   ├── Layout.tsx     # App shell + sidebar
    │   │   └── Common.tsx     # Reusable UI components
    │   ├── pages/
    │   │   ├── Login.tsx           # Authentication
    │   │   ├── Dashboard.tsx       # Command Center
    │   │   ├── Requests.tsx        # Request list
    │   │   ├── RequestDetail.tsx   # Request detail + timeline
    │   │   ├── NewRequest.tsx      # Multi-step creation with AI
    │   │   ├── AIAssignment.tsx    # AI agent matching
    │   │   ├── Agents.tsx          # Agent grid
    │   │   ├── AgentDetail.tsx     # Agent performance
    │   │   ├── Teams.tsx           # Team management
    │   │   ├── Analytics.tsx       # Data analytics
    │   │   ├── Predictive.tsx      # Demand forecasting
    │   │   ├── Reports.tsx         # Reporting
    │   │   ├── Automation.tsx      # Workflow rules
    │   │   ├── Integrations.tsx    # System connections
    │   │   ├── Settings.tsx        # Configuration
    │   │   ├── Compliance.tsx      # GDPR + audit
    │   │   └── APIDocs.tsx         # API documentation
    │   ├── App.tsx             # Router + protected routes
    │   ├── main.tsx            # Entry point
    │   └── index.css           # Tailwind + custom theme
    └── package.json
```

## API Endpoints

### Auth
- `POST /api/auth/login` — Login with email/password
- `GET /api/auth/me` — Current user info

### Requests
- `GET /api/requests` — List requests (filterable)
- `POST /api/requests` — Create request
- `GET /api/requests/:id` — Request details
- `PATCH /api/requests/:id` — Update request
- `POST /api/requests/:id/analyze` — AI analysis
- `POST /api/requests/:id/assign` — Assign agent
- `POST /api/requests/:id/status` — Update status
- `GET /api/requests/:id/events` — Event timeline

### AI
- `POST /api/ai/classify-request` — AI classification
- `POST /api/ai/recommend-assignment` — Agent recommendation
- `POST /api/ai/predict-sla-risk` — SLA risk assessment
- `GET /api/ai/model-status` — Model information

### Agents & Teams
- `GET /api/agents` — List agents
- `GET /api/agents/:id` — Agent details
- `GET /api/agents/:id/performance` — Performance metrics
- `GET /api/teams` — List teams

### Analytics
- `GET /api/analytics/overview` — Dashboard summary
- `GET /api/analytics/trends` — 30-day trends
- `GET /api/analytics/categories` — Category distribution
- `GET /api/analytics/sla` — SLA analysis
- `GET /api/analytics/agent-utilization` — Agent workload
- `GET /api/analytics/predictions` — Demand forecast

### Reports
- `GET /api/reports` — Saved reports
- `GET /api/reports/sla` — SLA compliance report
- `GET /api/reports/performance` — Agent performance report
- `POST /api/reports/generate` — Generate new report

### Automation
- `GET /api/automation/rules` — Automation rules
- `POST /api/automation/rules` — Create rule
- `PATCH /api/automation/rules/:id` — Update rule
- `DELETE /api/automation/rules/:id` — Delete rule
- `GET /api/automation/executions` — Execution history

### Integrations & Compliance
- `GET /api/integrations` — Integration list
- `POST /api/integrations/:id/test` — Test connection
- `GET /api/audit-logs` — Audit trail
- `GET /api/privacy/data-retention` — Data retention info

## AI Scoring System

### Classification
The AI engine uses keyword-based NLP to detect:
- **Category** — Delivery Delay, Billing Problem, Technical Failure, etc.
- **Sector** — Logistics, Telecom, Marketing, Finance, Retail, Healthcare
- **Sentiment** — Positive, Neutral, Negative, Angry
- **Urgency** — Based on urgency keywords in the text
- **Priority** — Critical/High/Medium/Low

### Agent Recommendation Formula
```
final_score =
  skill_match × 0.30 +
  availability × 0.20 +
  workload_balance × 0.15 +
  historical_success × 0.15 +
  sector_experience × 0.10 +
  SLA_fit × 0.10
```

### Scoring Components
| Factor | Weight | Source |
|--------|--------|--------|
| Skill Match | 30% | Agent skills vs request category |
| Availability | 20% | Current availability status |
| Workload Balance | 15% | Current workload vs capacity |
| Historical Success | 15% | Past resolution rate + satisfaction |
| Sector Experience | 10% | Sector specialization match |
| SLA Fit | 10% | Historical resolution time vs SLA target |

## Demo Flow

1. **Login** as `manager@yoyo.ai` / `manager`
2. **Dashboard** — See operational pulse, trends, AI insights
3. **New Request** → Create "Our shipment has been delayed..." → Click "AI ile Analiz Et" → See classification → Accept recommendation
4. **AI Assignment Center** — See unmatched requests, AI agent recommendations with score breakdown
5. **Agents** — Browse agent profiles with workload and performance
6. **Analytics** — Category distribution, SLA compliance, agent utilization
7. **Predictive Modeling** — Demand forecasts, model cards
8. **Reports** — SLA and performance reports
9. **Automation** — Workflow rules and execution history
10. **Integrations** — Connected system overview
11. **API Docs** — Full endpoint list

## Seed Data

The seed script creates:
- 15 users (5 roles)
- 6 teams (Logistics, Telecom, Marketing, Finance, Retail, Healthcare)
- 11 agents with varied skills and workload
- 25 customers across sectors
- 44+ service requests with realistic titles and descriptions
- 5 automation rules
- 10 integrations (connected/disconnected)
- 5 saved reports
- 30 audit log entries
- 20 AI model run records

## Known Limitations

- AI uses keyword-based simulation, not a real ML model
- Authentication is demo-level (no JWT validation, just base64 encoding)
- SQLite database (not production PostgreSQL)
- No real file uploads or email integration
- Charts are generated from seed data, not real-time

## Future Improvements

- Replace AI simulation with real ML/NLP models (Hugging Face, OpenAI, etc.)
- PostgreSQL with proper connection pooling
- Real authentication with JWT/SSO
- Real-time WebSocket notifications
- Mobile application
- File attachment support
- Multi-language support
- Advanced reporting with PDF export
- CI/CD pipeline
- Kubernetes deployment
- Monitoring and alerting (Prometheus/Grafana)
