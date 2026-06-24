import { Router } from 'express';
import { db, schema } from '../db/index.js';
import { eq, and } from 'drizzle-orm';
import { requireRole } from '../middleware/auth.js';

const router = Router();

// Teams requires admin, manager, or agent role
router.use(requireRole('admin', 'manager', 'agent'));

router.get('/', (req, res) => {
  try {
    const allTeams = db.select().from(schema.teams).all();
    const results = allTeams.map(t => {
      const teamAgents = db.select().from(schema.agents).where(eq(schema.agents.teamId, t.id)).all();
      const openRequests = db.select().from(schema.requests)
        .where(and(eq(schema.requests.assignedTeamId, t.id),
          eq(schema.requests.status, 'in_progress')))
        .all();
      const totalWorkload = teamAgents.reduce((sum, a) => sum + (a.currentWorkload || 0), 0);
      const totalCapacity = teamAgents.reduce((sum, a) => sum + (a.capacity || 0), 0);
      const avgSatisfaction = teamAgents.length > 0
        ? teamAgents.reduce((sum, a) => sum + (a.satisfactionScore || 0), 0) / teamAgents.length
        : 0;

      return {
        ...t,
        agentCount: teamAgents.length,
        openRequestCount: openRequests.length,
        totalWorkload,
        totalCapacity,
        utilization: totalCapacity > 0 ? Math.round((totalWorkload / totalCapacity) * 100) : 0,
        avgSatisfaction: Math.round(avgSatisfaction * 10) / 10,
        agents: teamAgents,
      };
    });
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch teams' });
  }
});

router.get('/:id', (req, res) => {
  try {
    const t = db.select().from(schema.teams).where(eq(schema.teams.id, req.params.id)).get();
    if (!t) return res.status(404).json({ error: 'Team not found' });

    const teamAgents = db.select().from(schema.agents).where(eq(schema.agents.teamId, t.id)).all();
    const requests = db.select().from(schema.requests).where(eq(schema.requests.assignedTeamId, t.id)).all();

    const resolved = requests.filter(r => r.status === 'resolved').length;
    const active = requests.filter(r => ['assigned', 'in_progress'].includes(r.status as string)).length;

    res.json({
      ...t,
      agents: teamAgents,
      totalRequests: requests.length,
      resolvedRequests: resolved,
      activeRequests: active,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch team' });
  }
});

export default router;
