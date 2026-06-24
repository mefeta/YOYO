import { Router } from 'express';
import { db, schema } from '../db/index.js';
import { eq, desc } from 'drizzle-orm';
import { v4 as uuid } from 'uuid';
import { generateInsights } from '../services/aiService.js';
import { validate, generateReportSchema } from '../middleware/validate.js';
const router = Router();
router.get('/', (req, res) => {
    try {
        const reports = db.select().from(schema.reports).orderBy(desc(schema.reports.createdAt)).all();
        res.json(reports);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch reports' });
    }
});
// GET /api/reports/sla — must be ABOVE /:id to avoid route capture
router.get('/sla', (req, res) => {
    try {
        const allRequests = db.select().from(schema.requests).all();
        const now = Date.now();
        const breached = allRequests.filter(r => {
            if (!r.slaDeadline || ['resolved', 'closed'].includes(r.status))
                return false;
            return new Date(r.slaDeadline).getTime() < now;
        });
        const compliant = allRequests.filter(r => {
            if (!r.slaDeadline)
                return false; // Don't count requests without SLA as compliant
            return ['resolved', 'closed'].includes(r.status) || new Date(r.slaDeadline).getTime() >= now;
        });
        const daily = [];
        for (let i = 6; i >= 0; i--) {
            const day = new Date(Date.now() - i * 86400000).toISOString().split('T')[0];
            const dayReqs = allRequests.filter(r => r.createdAt?.startsWith(day));
            const dayBreached = dayReqs.filter(r => r.slaDeadline && new Date(r.slaDeadline).getTime() < now && !['resolved', 'closed'].includes(r.status));
            daily.push({
                date: day,
                total: dayReqs.length,
                breached: dayBreached.length,
                complianceRate: dayReqs.length > 0 ? Math.round(((dayReqs.length - dayBreached.length) / dayReqs.length) * 100) : 100,
            });
        }
        res.json({
            totalCompliant: compliant.length,
            totalBreached: breached.length,
            complianceRate: allRequests.length > 0 ? Math.round((compliant.length / allRequests.length) * 100) : 100,
            daily,
        });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch SLA report' });
    }
});
// GET /api/reports/performance — must be ABOVE /:id
router.get('/performance', (req, res) => {
    try {
        const allAgents = db.select().from(schema.agents).all();
        const data = allAgents.map(a => {
            const user = a.userId ? db.select().from(schema.users).where(eq(schema.users.id, a.userId)).get() : null;
            const resolved = db.select().from(schema.requests)
                .where(eq(schema.requests.assignedAgentId, a.id))
                .all()
                .filter(r => r.status === 'resolved');
            return {
                agentId: a.id,
                agentName: user?.name || 'Unknown',
                resolvedCount: resolved.length,
                avgResolutionTime: a.avgResolutionTime,
                satisfactionScore: a.satisfactionScore,
                workload: a.currentWorkload,
                utilization: (a.capacity || 0) > 0 ? Math.round(((a.currentWorkload || 0) / (a.capacity || 1)) * 100) : 0,
            };
        });
        res.json(data);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch performance report' });
    }
});
router.post('/generate', validate(generateReportSchema), (req, res) => {
    try {
        const { name, type, filters } = req.body;
        const allRequests = db.select().from(schema.requests).all();
        const allAgents = db.select().from(schema.agents).all();
        const insights = generateInsights(allRequests, allAgents);
        const id = uuid();
        const now = new Date().toISOString();
        let summary = '';
        switch (type) {
            case 'operational_performance':
                const open = allRequests.filter(r => !['resolved', 'closed'].includes(r.status)).length;
                const resov = allRequests.filter(r => r.status === 'resolved').length;
                summary = `Operational performance report: ${open} open requests, ${resov} resolved requests. ${insights[0] || ''}`;
                break;
            case 'sla_compliance':
                const breached = allRequests.filter(r => r.slaDeadline && new Date(r.slaDeadline).getTime() < Date.now()).length;
                summary = `SLA compliance report: ${breached} of ${allRequests.length} requests breached SLA. Compliance rate: ${Math.round(((allRequests.length - breached) / allRequests.length) * 100)}%.`;
                break;
            default:
                summary = insights.join(' ');
        }
        db.insert(schema.reports).values({
            id,
            name: name || `${type} Raporu`,
            type,
            filters: JSON.stringify(filters || {}),
            generatedBy: req.headers['x-user-id'] || null,
            summary,
            createdAt: now,
        }).run();
        const created = db.select().from(schema.reports).where(eq(schema.reports.id, id)).get();
        res.status(201).json(created);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to generate report' });
    }
});
export default router;
//# sourceMappingURL=reports.js.map