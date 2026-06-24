import { Router } from 'express';
import { db, schema } from '../db/index.js';
import { eq, and, sql } from 'drizzle-orm';
import { generateInsights } from '../services/aiService.js';
const router = Router();
// GET /api/analytics/overview
router.get('/overview', (req, res) => {
    try {
        const allAgents = db.select().from(schema.agents).all();
        const today = new Date().toISOString().split('T')[0];
        const openCount = db.select({ count: sql `COUNT(*)` }).from(schema.requests)
            .where(sql `status NOT IN ('resolved', 'closed')`).get()?.count || 0;
        const newTodayCount = db.select({ count: sql `COUNT(*)` }).from(schema.requests)
            .where(sql `created_at LIKE ${today + '%'}`).get()?.count || 0;
        const resolvedCount = db.select({ count: sql `COUNT(*)` }).from(schema.requests)
            .where(eq(schema.requests.status, 'resolved')).get()?.count || 0;
        // Average resolution time (SQL-side computation)
        const avgResult = db.select({
            avg: sql `AVG(
        CASE WHEN resolved_at IS NOT NULL AND created_at IS NOT NULL
        THEN (julianday(resolved_at) - julianday(created_at)) * 1440
        ELSE NULL END
      )`
        }).from(schema.requests).where(eq(schema.requests.status, 'resolved')).get();
        const avgResponse = avgResult?.avg || 0;
        const totalAgents = allAgents.length;
        const busyAgents = allAgents.filter(a => a.availabilityStatus === 'busy').length;
        // Trend data using SQL GROUP BY
        const trendRows = db.select({
            date: sql `substr(created_at, 1, 10)`,
            count: sql `COUNT(*)`
        }).from(schema.requests)
            .where(sql `created_at >= date('now', '-7 days')`)
            .groupBy(sql `substr(created_at, 1, 10)`)
            .orderBy(sql `substr(created_at, 1, 10)`)
            .all();
        // Fill in missing days
        const trendData = [];
        for (let i = 6; i >= 0; i--) {
            const day = new Date(Date.now() - i * 86400000).toISOString().split('T')[0];
            const found = trendRows.find((r) => r.date === day);
            trendData.push({ date: day, count: found ? Number(found.count) : 0 });
        }
        // Category distribution using SQL GROUP BY
        const catRows = db.select({
            category: schema.requests.category,
            count: sql `COUNT(*)`
        }).from(schema.requests)
            .groupBy(schema.requests.category)
            .all();
        const categoryDistribution = catRows.map((r) => ({ category: r.category, count: Number(r.count) }));
        // Priority distribution
        const priRows = db.select({
            priority: schema.requests.priority,
            count: sql `COUNT(*)`
        }).from(schema.requests)
            .groupBy(schema.requests.priority)
            .all();
        const priorityDistribution = priRows.map((r) => ({ priority: r.priority, count: Number(r.count) }));
        // Sector distribution
        const secRows = db.select({
            sector: schema.requests.sector,
            count: sql `COUNT(*)`
        }).from(schema.requests)
            .groupBy(schema.requests.sector)
            .all();
        const sectorDistribution = secRows.map((r) => ({ sector: r.sector, count: Number(r.count) }));
        // Insights need the data, limit to last 1000 records for performance
        const recentRequests = db.select().from(schema.requests)
            .orderBy(sql `created_at DESC`).limit(1000).all();
        const insights = generateInsights(recentRequests, allAgents);
        res.json({
            totalOpenRequests: Number(openCount),
            newRequestsToday: Number(newTodayCount),
            resolvedRequests: Number(resolvedCount),
            avgResponseTimeMinutes: Math.round(Number(avgResponse)),
            totalAgents,
            busyAgents,
            agentUtilization: totalAgents > 0 ? Math.round((busyAgents / totalAgents) * 100) : 0,
            requestVolumeTrend: trendData,
            categoryDistribution,
            priorityDistribution,
            sectorDistribution,
            insights,
        });
    }
    catch (error) {
        console.error('Analytics overview error:', error);
        res.status(500).json({ error: 'Failed to fetch analytics' });
    }
});
// GET /api/analytics/trends
router.get('/trends', (req, res) => {
    try {
        const rows = db.select({
            date: sql `substr(created_at, 1, 10)`,
            count: sql `COUNT(*)`
        }).from(schema.requests)
            .where(sql `created_at >= date('now', '-30 days')`)
            .groupBy(sql `substr(created_at, 1, 10)`)
            .orderBy(sql `substr(created_at, 1, 10)`)
            .all();
        const data = [];
        for (let i = 29; i >= 0; i--) {
            const day = new Date(Date.now() - i * 86400000).toISOString().split('T')[0];
            const found = rows.find((r) => r.date === day);
            data.push({ date: day, value: found ? Number(found.count) : 0, metric: 'request_volume' });
        }
        res.json(data);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch trends' });
    }
});
// GET /api/analytics/categories
router.get('/categories', (req, res) => {
    try {
        // Category x Priority matrix
        const catRows = db.select({
            category: schema.requests.category,
            priority: schema.requests.priority,
            count: sql `COUNT(*)`
        }).from(schema.requests)
            .groupBy(schema.requests.category, schema.requests.priority)
            .all();
        const categories = {};
        const sectors = {};
        // Sector x Category matrix
        const secCatRows = db.select({
            sector: schema.requests.sector,
            category: schema.requests.category,
            count: sql `COUNT(*)`
        }).from(schema.requests)
            .groupBy(schema.requests.sector, schema.requests.category)
            .all();
        for (const r of catRows) {
            if (!categories[r.category])
                categories[r.category] = {};
            categories[r.category][r.priority] = Number(r.count);
        }
        for (const r of secCatRows) {
            if (!sectors[r.sector])
                sectors[r.sector] = {};
            sectors[r.sector][r.category] = Number(r.count);
        }
        const heatmapData = secCatRows.map((r) => ({ sector: r.sector, category: r.category, count: Number(r.count) }));
        res.json({ categories, sectors, heatmap: heatmapData });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch categories' });
    }
});
// GET /api/analytics/sla
router.get('/sla', (req, res) => {
    try {
        const now = Date.now();
        const nowISO = new Date().toISOString();
        const total = db.select({ count: sql `COUNT(*)` }).from(schema.requests).get()?.count || 0;
        // Breached: has sla_deadline, not resolved/closed, deadline < now
        const breached = db.select({ count: sql `COUNT(*)` }).from(schema.requests)
            .where(and(sql `sla_deadline IS NOT NULL`, sql `status NOT IN ('resolved', 'closed')`, sql `sla_deadline < ${nowISO}`)).get()?.count || 0;
        // At risk: not breached, deadline within 1 hour
        const atRisk = db.select({ count: sql `COUNT(*)` }).from(schema.requests)
            .where(and(sql `sla_deadline IS NOT NULL`, sql `status NOT IN ('resolved', 'closed')`, sql `sla_deadline >= ${nowISO}`, sql `sla_deadline < datetime('now', '+1 hour')`)).get()?.count || 0;
        // SLA by sector using SQL GROUP BY
        const sectorRows = db.select({
            sector: schema.requests.sector,
            total: sql `COUNT(*)`,
            breached: sql `SUM(CASE WHEN sla_deadline IS NOT NULL AND status NOT IN ('resolved', 'closed') AND sla_deadline < ${nowISO} THEN 1 ELSE 0 END)`
        }).from(schema.requests)
            .groupBy(schema.requests.sector)
            .all();
        const sectorSLA = {};
        for (const r of sectorRows) {
            sectorSLA[r.sector] = { total: Number(r.total), breached: Number(r.breached) };
        }
        res.json({
            total: Number(total),
            breached: Number(breached),
            atRisk: Number(atRisk),
            complianceRate: Number(total) > 0
                ? Math.round(((Number(total) - Number(breached)) / Number(total)) * 100)
                : 100,
            sectorSLA,
        });
    }
    catch (error) {
        console.error('SLA analytics error:', error);
        res.status(500).json({ error: 'Failed to fetch SLA data' });
    }
});
// GET /api/analytics/agent-utilization
router.get('/agent-utilization', (req, res) => {
    try {
        const allAgents = db.select().from(schema.agents).all();
        const data = allAgents.map(a => {
            const user = a.userId ? db.select().from(schema.users).where(eq(schema.users.id, a.userId)).get() : null;
            const load = a.currentWorkload || 0;
            const cap = a.capacity || 10;
            return {
                agentId: a.id,
                agentName: user?.name || 'Unknown',
                workload: load,
                capacity: cap,
                utilization: cap > 0 ? Math.round((load / cap) * 100) : 0,
                status: a.availabilityStatus,
            };
        });
        res.json(data);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch utilization' });
    }
});
export default router;
//# sourceMappingURL=analytics.js.map