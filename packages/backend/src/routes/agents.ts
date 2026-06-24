import { Router } from 'express';
import { db, schema } from '../db/index.js';
import { eq, and, desc, sql } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { v4 as uuid } from 'uuid';
import type { AuthRequest } from '../middleware/auth.js';

const router = Router();

// GET /api/agents
router.get('/', (_req, res) => {
  try {
    const allAgents = db.select().from(schema.agents).all();
    const results = allAgents.map(a => {
      const user = a.userId ? db.select().from(schema.users).where(eq(schema.users.id, a.userId)).get() : null;
      const team = a.teamId ? db.select().from(schema.teams).where(eq(schema.teams.id, a.teamId)).get() : null;

      // Compute efficiency from actual DB counts
      const totalAssigned = (db.select({ count: sql<number>`COUNT(*)` }).from(schema.requests)
        .where(eq(schema.requests.assignedAgentId, a.id)).get() as any)?.count || 0;
      const totalResolved = (db.select({ count: sql<number>`COUNT(*)` }).from(schema.requests)
        .where(and(eq(schema.requests.assignedAgentId, a.id), eq(schema.requests.status, 'resolved'))).get() as any)?.count || 0;
      const slaMet = (db.select({ count: sql<number>`COUNT(*)` }).from(schema.requests)
        .where(and(eq(schema.requests.assignedAgentId, a.id), eq(schema.requests.status, 'resolved'),
          sql`(sla_deadline IS NULL OR resolved_at <= sla_deadline)`)).get() as any)?.count || 0;

      return {
        ...a,
        name: user?.name || a.roleTitle || 'AI Agent',
        email: user?.email || '',
        role: user?.role || 'agent',
        teamName: team?.name || null,
        totalAssigned,
        totalResolved,
        efficiencyRate: totalAssigned > 0 ? Math.round((totalResolved / totalAssigned) * 100) : 0,
        slaComplianceRate: totalResolved > 0 ? Math.round((slaMet / totalResolved) * 100) : 100,
      };
    });
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch agents' });
  }
});

// POST /api/agents — Admin-only: create a new AI agent with user record
router.post('/', (req: AuthRequest, res) => {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { name, email, roleTitle, skills, sectors, teamId, capacity } = req.body;
    if (!name || !email || !roleTitle) {
      return res.status(400).json({ error: 'name, email, and roleTitle are required' });
    }

    const now = new Date().toISOString();
    const userId = uuid();
    const agentId = uuid();

    // Create user record
    db.insert(schema.users).values({
      id: userId,
      name,
      email,
      passwordHash: bcrypt.hashSync('agent123', 10),
      role: 'agent',
      createdAt: now,
    }).run();

    // Create agent record
    const skillsArr = skills ? (Array.isArray(skills) ? skills : skills.split(',').map((s: string) => s.trim())) : ['General'];
    const sectorsArr = sectors ? (Array.isArray(sectors) ? sectors : sectors.split(',').map((s: string) => s.trim())) : ['Technology'];

    db.insert(schema.agents).values({
      id: agentId,
      userId,
      teamId: teamId || null,
      roleTitle,
      skills: JSON.stringify(skillsArr),
      sectors: JSON.stringify(sectorsArr),
      languages: '["Turkish","English"]',
      availabilityStatus: 'available',
      capacity: parseInt(capacity) || 10,
      currentWorkload: 0,
      avgResolutionTime: 0,
      satisfactionScore: 0,
      createdAt: now,
    }).run();

    const created = db.select().from(schema.agents).where(eq(schema.agents.id, agentId)).get();
    const team = created?.teamId ? db.select().from(schema.teams).where(eq(schema.teams.id, created.teamId)).get() : null;

    res.status(201).json({
      ...created,
      name,
      email,
      role: 'agent',
      teamName: team?.name || null,
    });
  } catch (error) {
    console.error('Error creating agent:', error);
    res.status(500).json({ error: 'Failed to create agent' });
  }
});

// DELETE /api/agents/:id — Admin-only
router.delete('/:id', (req: AuthRequest, res) => {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const a = db.select().from(schema.agents).where(eq(schema.agents.id, String(req.params.id))).get();
    if (!a) return res.status(404).json({ error: 'Agent not found' });

    // Delete associated user if exists
    if (a.userId) {
      db.delete(schema.users).where(eq(schema.users.id, a.userId)).run();
    }
    // Delete agent
    db.delete(schema.agents).where(eq(schema.agents.id, a.id)).run();

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting agent:', error);
    res.status(500).json({ error: 'Failed to delete agent' });
  }
});

// GET /api/agents/:id
router.get('/:id', (req, res) => {
  try {
    const a = db.select().from(schema.agents).where(eq(schema.agents.id, req.params.id)).get();
    if (!a) return res.status(404).json({ error: 'Agent not found' });

    const user = a.userId ? db.select().from(schema.users).where(eq(schema.users.id, a.userId)).get() : null;
    const team = a.teamId ? db.select().from(schema.teams).where(eq(schema.teams.id, a.teamId)).get() : null;

    // Get active requests for this agent
    const activeRequests = db.select().from(schema.requests)
      .where(and(eq(schema.requests.assignedAgentId, a.id),
        eq(schema.requests.status, 'in_progress')))
      .all();

    // Get recent assignments
    const recentRequests = db.select().from(schema.requests)
      .where(eq(schema.requests.assignedAgentId, a.id))
      .orderBy(desc(schema.requests.createdAt))
      .limit(10)
      .all();

    // Compute efficiency from actual DB counts
    const totalAssigned = (db.select({ count: sql<number>`COUNT(*)` }).from(schema.requests)
      .where(eq(schema.requests.assignedAgentId, a.id)).get() as any)?.count || 0;
    const totalResolved = (db.select({ count: sql<number>`COUNT(*)` }).from(schema.requests)
      .where(and(eq(schema.requests.assignedAgentId, a.id), eq(schema.requests.status, 'resolved'))).get() as any)?.count || 0;
    const slaMet = (db.select({ count: sql<number>`COUNT(*)` }).from(schema.requests)
      .where(and(eq(schema.requests.assignedAgentId, a.id), eq(schema.requests.status, 'resolved'),
        sql`(sla_deadline IS NULL OR resolved_at <= sla_deadline)`)).get() as any)?.count || 0;

    res.json({
      ...a,
      name: user?.name || a.roleTitle || 'AI Agent',
      email: user?.email || '',
      role: user?.role || 'agent',
      teamName: team?.name || null,
      activeRequests,
      recentRequests,
      totalAssigned,
      totalResolved,
      efficiencyRate: totalAssigned > 0 ? Math.round((totalResolved / totalAssigned) * 100) : 0,
      slaComplianceRate: totalResolved > 0 ? Math.round((slaMet / totalResolved) * 100) : 100,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch agent' });
  }
});

// GET /api/agents/:id/performance
router.get('/:id/performance', (req, res) => {
  try {
    const a = db.select().from(schema.agents).where(eq(schema.agents.id, req.params.id)).get();
    if (!a) return res.status(404).json({ error: 'Agent not found' });

    const resolved = db.select().from(schema.requests)
      .where(and(eq(schema.requests.assignedAgentId, a.id),
        eq(schema.requests.status, 'resolved')))
      .all();

    const resolutionTimes = resolved.map(r => {
      if (!r.resolvedAt || !r.createdAt) return 0;
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
      const dayResolved = resolved.filter(r =>
        r.resolvedAt && r.resolvedAt >= dayStart && r.resolvedAt < dayEnd
      );
      weeklyData.push({
        date: dayStart.split('T')[0],
        resolved: dayResolved.length,
        avgTime: avgResolution,
      });
    }

    const totalAssigned = (db.select({ count: sql<number>`COUNT(*)` }).from(schema.requests)
      .where(eq(schema.requests.assignedAgentId, a.id)).get() as any)?.count || 0;
    const slaMet = resolved.filter(r => !r.slaDeadline || (r.resolvedAt && r.resolvedAt <= r.slaDeadline)).length;

    res.json({
      agentId: a.id,
      totalAssigned,
      totalResolved: resolved.length,
      efficiencyRate: totalAssigned > 0 ? Math.round((resolved.length / totalAssigned) * 100) : 0,
      slaComplianceRate: resolved.length > 0 ? Math.round((slaMet / resolved.length) * 100) : 100,
      avgResolutionTime: Math.round(avgResolution * 10) / 10,
      satisfactionScore: a.satisfactionScore,
      workload: a.currentWorkload,
      capacity: a.capacity,
      utilization: (a.capacity || 0) > 0 ? Math.round(((a.currentWorkload || 0) / (a.capacity || 1)) * 100) : 0,
      weeklyData,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch performance' });
  }
});

export default router;
