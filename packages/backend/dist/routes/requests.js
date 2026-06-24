import { Router } from 'express';
import { db, schema } from '../db/index.js';
import { eq, desc, and, sql } from 'drizzle-orm';
import { v4 as uuid } from 'uuid';
import { analyzeRequest } from '../services/aiService.js';
import { validate, createRequestSchema, assignSchema, statusSchema } from '../middleware/validate.js';
const router = Router();
// GET /api/requests — with pagination for 200K records
router.get('/', (req, res) => {
    try {
        const { status, priority, sector, category, search, sortBy, sortOrder, limit, offset } = req.query;
        const limitVal = Math.min(parseInt(limit) || 100, 500);
        const offsetVal = parseInt(offset) || 0;
        let conditions = [];
        if (status)
            conditions.push(sql `status = ${status}`);
        if (priority)
            conditions.push(sql `priority = ${priority}`);
        if (sector)
            conditions.push(sql `sector = ${sector}`);
        if (category)
            conditions.push(sql `category = ${category}`);
        if (search) {
            const s = `%${search}%`;
            conditions.push(sql `(title LIKE ${s} OR description LIKE ${s})`);
        }
        const baseQuery = db.select({
            id: schema.requests.id,
            title: schema.requests.title,
            description: schema.requests.description,
            customerId: schema.requests.customerId,
            sector: schema.requests.sector,
            channel: schema.requests.channel,
            category: schema.requests.category,
            priority: schema.requests.priority,
            status: schema.requests.status,
            sentiment: schema.requests.sentiment,
            slaDeadline: schema.requests.slaDeadline,
            assignedAgentId: schema.requests.assignedAgentId,
            assignedTeamId: schema.requests.assignedTeamId,
            createdAt: schema.requests.createdAt,
            updatedAt: schema.requests.updatedAt,
            customerName: schema.customers.name,
            customerCompany: schema.customers.company,
            agentName: schema.users.name,
        })
            .from(schema.requests)
            .leftJoin(schema.customers, eq(schema.requests.customerId, schema.customers.id))
            .leftJoin(schema.agents, eq(schema.requests.assignedAgentId, schema.agents.id))
            .leftJoin(schema.users, eq(schema.agents.userId, schema.users.id));
        let finalQuery = baseQuery;
        if (conditions.length > 0) {
            finalQuery = finalQuery.where(and(...conditions));
        }
        const query = finalQuery.orderBy(desc(schema.requests.createdAt)).limit(limitVal).offset(offsetVal).all();
        const totalCount = conditions.length > 0
            ? db.select({ count: sql `COUNT(*)` }).from(schema.requests).where(and(...conditions)).get()?.count || 0
            : db.select({ count: sql `COUNT(*)` }).from(schema.requests).get()?.count || 0;
        const results = query.map(r => ({
            id: r.id,
            title: r.title,
            description: r.description,
            customerId: r.customerId,
            sector: r.sector,
            channel: r.channel,
            category: r.category,
            priority: r.priority,
            status: r.status,
            sentiment: r.sentiment,
            slaDeadline: r.slaDeadline,
            assignedAgentId: r.assignedAgentId,
            assignedTeamId: r.assignedTeamId,
            createdAt: r.createdAt,
            updatedAt: r.updatedAt,
            customerName: r.customerName || 'Unknown',
            customerCompany: r.customerCompany || '',
            agentName: r.agentName || null,
        }));
        res.set('X-Total-Count', String(totalCount));
        res.json(results);
    }
    catch (error) {
        console.error('Error fetching requests:', error);
        res.status(500).json({ error: 'Failed to fetch requests' });
    }
});
// GET /api/requests/:id
router.get('/:id', (req, res) => {
    try {
        const r = db.select().from(schema.requests).where(eq(schema.requests.id, String(req.params.id))).get();
        if (!r)
            return res.status(404).json({ error: 'Request not found' });
        const customer = r.customerId ? db.select().from(schema.customers).where(eq(schema.customers.id, r.customerId)).get() : null;
        const agent = r.assignedAgentId ? db.select().from(schema.agents).where(eq(schema.agents.id, r.assignedAgentId)).get() : null;
        const agentUser = agent?.userId ? db.select().from(schema.users).where(eq(schema.users.id, agent.userId)).get() : null;
        const events = db.select().from(schema.requestEvents).where(eq(schema.requestEvents.requestId, r.id)).orderBy(desc(schema.requestEvents.createdAt)).all();
        const rec = db.select().from(schema.assignmentRecommendations).where(eq(schema.assignmentRecommendations.requestId, r.id)).get();
        res.json({
            ...r,
            customerName: customer?.name || 'Unknown',
            customerCompany: customer?.company || '',
            agentName: agentUser?.name || null,
            events,
            recommendation: rec,
        });
    }
    catch (error) {
        console.error('Error fetching request:', error);
        res.status(500).json({ error: 'Failed to fetch request' });
    }
});
// POST /api/requests
router.post('/', validate(createRequestSchema), (req, res) => {
    try {
        const { title, description, customerId, sector, channel, category } = req.body;
        const id = `REQ-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        const now = new Date().toISOString();
        db.insert(schema.requests).values({
            id,
            title,
            description,
            customerId: customerId || null,
            sector: sector || 'General',
            channel: channel || 'web',
            category: category || 'General',
            status: 'new',
            createdAt: now,
            updatedAt: now,
        }).run();
        // Create event
        db.insert(schema.requestEvents).values({
            id: uuid(),
            requestId: id,
            eventType: 'created',
            newValue: 'new',
            createdAt: now,
        }).run();
        const created = db.select().from(schema.requests).where(eq(schema.requests.id, id)).get();
        res.status(201).json(created);
    }
    catch (error) {
        console.error('Error creating request:', error);
        res.status(500).json({ error: 'Failed to create request' });
    }
});
// POST /api/requests/:id/analyze
router.post('/:id/analyze', (req, res) => {
    try {
        const r = db.select().from(schema.requests).where(eq(schema.requests.id, String(req.params.id))).get();
        if (!r)
            return res.status(404).json({ error: 'Request not found' });
        const analysis = analyzeRequest({ title: r.title, description: r.description });
        // Update request with AI analysis
        db.update(schema.requests).set({
            category: analysis.predictedCategory,
            priority: analysis.priority,
            sentiment: analysis.sentiment,
            aiConfidence: analysis.confidence,
            aiSummary: analysis.summary,
            aiExplanation: analysis.explanation,
            estimatedResolutionTime: analysis.estimatedResolutionMinutes,
            status: 'analyzing',
            updatedAt: new Date().toISOString(),
        }).where(eq(schema.requests.id, r.id)).run();
        // Log event
        db.insert(schema.requestEvents).values({
            id: uuid(),
            requestId: r.id,
            eventType: 'ai_analyzed',
            newValue: analysis.predictedCategory,
            note: `AI classification: ${analysis.predictedCategory} (${analysis.confidence}% confidence)`,
            createdAt: new Date().toISOString(),
        }).run();
        // Log AI model run
        db.insert(schema.aiModelRuns).values({
            id: uuid(),
            modelName: 'category_classification',
            inputSnapshot: JSON.stringify({ title: r.title, description: r.description }),
            outputSnapshot: JSON.stringify(analysis),
            confidence: analysis.confidence,
            createdAt: new Date().toISOString(),
        }).run();
        res.json(analysis);
    }
    catch (error) {
        console.error('Error analyzing request:', error);
        res.status(500).json({ error: 'Failed to analyze request' });
    }
});
// POST /api/requests/:id/assign
router.post('/:id/assign', validate(assignSchema), (req, res) => {
    try {
        const { agentId, teamId } = req.body;
        const requestId = req.params.id;
        const r = db.select().from(schema.requests).where(eq(schema.requests.id, requestId)).get();
        if (!r)
            return res.status(404).json({ error: 'Request not found' });
        const now = new Date().toISOString();
        // Calculate SLA deadline based on priority
        const slaMinutes = { critical: 30, high: 120, medium: 480, low: 1440 };
        const pri = r.priority || 'medium';
        const slaDeadline = new Date(Date.now() + (slaMinutes[pri] || 480) * 60000).toISOString();
        db.update(schema.requests).set({
            assignedAgentId: agentId || null,
            assignedTeamId: teamId || null,
            status: 'assigned',
            slaDeadline,
            updatedAt: now,
        }).where(eq(schema.requests.id, r.id)).run();
        // Increment agent workload
        if (agentId) {
            const agent = db.select().from(schema.agents).where(eq(schema.agents.id, agentId)).get();
            if (agent) {
                db.update(schema.agents).set({
                    currentWorkload: (agent.currentWorkload || 0) + 1,
                }).where(eq(schema.agents.id, agentId)).run();
            }
        }
        db.insert(schema.requestEvents).values({
            id: uuid(),
            requestId: r.id,
            eventType: 'assigned',
            newValue: agentId,
            note: agentId ? 'Assigned via AI recommendation' : 'Assignment completed',
            createdAt: now,
        }).run();
        db.insert(schema.requestEvents).values({
            id: uuid(),
            requestId: r.id,
            eventType: 'status_change',
            oldValue: r.status,
            newValue: 'assigned',
            createdAt: now,
        }).run();
        const updated = db.select().from(schema.requests).where(eq(schema.requests.id, r.id)).get();
        res.json(updated);
    }
    catch (error) {
        console.error('Error assigning request:', error);
        res.status(500).json({ error: 'Failed to assign request' });
    }
});
// PATCH /api/requests/:id
router.patch('/:id', (req, res) => {
    try {
        const r = db.select().from(schema.requests).where(eq(schema.requests.id, String(req.params.id))).get();
        if (!r)
            return res.status(404).json({ error: 'Request not found' });
        const updates = { updatedAt: new Date().toISOString() };
        for (const [key, value] of Object.entries(req.body)) {
            if (['title', 'description', 'priority', 'status', 'assignedAgentId', 'assignedTeamId', 'sector', 'category'].includes(key)) {
                updates[key] = value;
            }
        }
        db.update(schema.requests).set(updates).where(eq(schema.requests.id, r.id)).run();
        // Log status changes
        if (updates.status && updates.status !== r.status) {
            db.insert(schema.requestEvents).values({
                id: uuid(),
                requestId: r.id,
                eventType: 'status_change',
                oldValue: r.status,
                newValue: updates.status,
                createdAt: new Date().toISOString(),
            }).run();
        }
        const updated = db.select().from(schema.requests).where(eq(schema.requests.id, r.id)).get();
        res.json(updated);
    }
    catch (error) {
        console.error('Error updating request:', error);
        res.status(500).json({ error: 'Failed to update request' });
    }
});
// POST /api/requests/:id/status
router.post('/:id/status', validate(statusSchema), (req, res) => {
    try {
        const { status } = req.body;
        const r = db.select().from(schema.requests).where(eq(schema.requests.id, String(req.params.id))).get();
        if (!r)
            return res.status(404).json({ error: 'Request not found' });
        const now = new Date().toISOString();
        const updates = { status, updatedAt: now };
        if (status === 'resolved' || status === 'closed') {
            updates.resolvedAt = now;
            // Decrement agent workload
            if (r.assignedAgentId) {
                const agent = db.select().from(schema.agents).where(eq(schema.agents.id, r.assignedAgentId)).get();
                if (agent) {
                    db.update(schema.agents).set({
                        currentWorkload: Math.max(0, (agent.currentWorkload || 1) - 1),
                        avgResolutionTime: agent.avgResolutionTime
                            ? (agent.avgResolutionTime + (r.estimatedResolutionTime || 60)) / 2
                            : (r.estimatedResolutionTime || 60),
                    }).where(eq(schema.agents.id, r.assignedAgentId)).run();
                }
            }
        }
        db.update(schema.requests).set(updates).where(eq(schema.requests.id, r.id)).run();
        db.insert(schema.requestEvents).values({
            id: uuid(),
            requestId: r.id,
            eventType: 'status_change',
            oldValue: r.status,
            newValue: status,
            createdAt: now,
        }).run();
        const updated = db.select().from(schema.requests).where(eq(schema.requests.id, r.id)).get();
        res.json(updated);
    }
    catch (error) {
        console.error('Error updating status:', error);
        res.status(500).json({ error: 'Failed to update status' });
    }
});
// GET /api/requests/:id/events
router.get('/:id/events', (req, res) => {
    try {
        const events = db.select().from(schema.requestEvents)
            .where(eq(schema.requestEvents.requestId, String(req.params.id)))
            .orderBy(desc(schema.requestEvents.createdAt))
            .all();
        res.json(events);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch events' });
    }
});
export default router;
//# sourceMappingURL=requests.js.map