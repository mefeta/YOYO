import { Router } from 'express';
import { db, schema } from '../db/index.js';
import { eq, and, desc } from 'drizzle-orm';
const router = Router();
// GET /api/agents
router.get('/', (req, res) => {
    try {
        const allAgents = db.select().from(schema.agents).all();
        const results = allAgents.map(a => {
            const user = a.userId ? db.select().from(schema.users).where(eq(schema.users.id, a.userId)).get() : null;
            const team = a.teamId ? db.select().from(schema.teams).where(eq(schema.teams.id, a.teamId)).get() : null;
            return {
                ...a,
                name: user?.name || 'Unknown',
                email: user?.email || '',
                role: user?.role || 'agent',
                teamName: team?.name || null,
            };
        });
        res.json(results);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch agents' });
    }
});
// GET /api/agents/:id
router.get('/:id', (req, res) => {
    try {
        const a = db.select().from(schema.agents).where(eq(schema.agents.id, req.params.id)).get();
        if (!a)
            return res.status(404).json({ error: 'Agent not found' });
        const user = a.userId ? db.select().from(schema.users).where(eq(schema.users.id, a.userId)).get() : null;
        const team = a.teamId ? db.select().from(schema.teams).where(eq(schema.teams.id, a.teamId)).get() : null;
        // Get active requests for this agent
        const activeRequests = db.select().from(schema.requests)
            .where(and(eq(schema.requests.assignedAgentId, a.id), eq(schema.requests.status, 'in_progress')))
            .all();
        // Get recent assignments
        const recentRequests = db.select().from(schema.requests)
            .where(eq(schema.requests.assignedAgentId, a.id))
            .orderBy(desc(schema.requests.createdAt))
            .limit(10)
            .all();
        res.json({
            ...a,
            name: user?.name || 'Unknown',
            email: user?.email || '',
            role: user?.role || 'agent',
            teamName: team?.name || null,
            activeRequests,
            recentRequests,
        });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch agent' });
    }
});
// GET /api/agents/:id/performance
router.get('/:id/performance', (req, res) => {
    try {
        const a = db.select().from(schema.agents).where(eq(schema.agents.id, req.params.id)).get();
        if (!a)
            return res.status(404).json({ error: 'Agent not found' });
        const resolved = db.select().from(schema.requests)
            .where(and(eq(schema.requests.assignedAgentId, a.id), eq(schema.requests.status, 'resolved')))
            .all();
        const resolutionTimes = resolved.map(r => {
            if (!r.resolvedAt || !r.createdAt)
                return 0;
            return (new Date(r.resolvedAt).getTime() - new Date(r.createdAt).getTime()) / 3600000;
        }).filter(t => t > 0);
        const avgResolution = resolutionTimes.length > 0
            ? resolutionTimes.reduce((a, b) => a + b, 0) / resolutionTimes.length
            : 0;
        // Weekly performance data
        const weeklyData = [];
        for (let i = 6; i >= 0; i--) {
            const day = new Date(Date.now() - i * 86400000);
            const dayStart = new Date(day.getFullYear(), day.getMonth(), day.getDate()).toISOString();
            const dayEnd = new Date(day.getFullYear(), day.getMonth(), day.getDate() + 1).toISOString();
            const dayResolved = resolved.filter(r => r.resolvedAt && r.resolvedAt >= dayStart && r.resolvedAt < dayEnd);
            weeklyData.push({
                date: dayStart.split('T')[0],
                resolved: dayResolved.length,
                avgTime: avgResolution,
            });
        }
        res.json({
            agentId: a.id,
            totalResolved: resolved.length,
            avgResolutionTime: Math.round(avgResolution * 10) / 10,
            satisfactionScore: a.satisfactionScore,
            workload: a.currentWorkload,
            capacity: a.capacity,
            utilization: (a.capacity || 0) > 0 ? Math.round(((a.currentWorkload || 0) / (a.capacity || 1)) * 100) : 0,
            weeklyData,
        });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch performance' });
    }
});
export default router;
//# sourceMappingURL=agents.js.map