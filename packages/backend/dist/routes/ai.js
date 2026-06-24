import { Router } from 'express';
import { db, schema } from '../db/index.js';
import { eq, desc } from 'drizzle-orm';
import { v4 as uuid } from 'uuid';
import { analyzeRequest, recommendAgent } from '../services/aiService.js';
import { validate, classifySchema, recommendSchema } from '../middleware/validate.js';
const router = Router();
// POST /api/ai/classify-request
router.post('/classify-request', validate(classifySchema), (req, res) => {
    try {
        const { title, description } = req.body;
        const result = analyzeRequest({ title, description: description || '' });
        // Log AI model run
        db.insert(schema.aiModelRuns).values({
            id: uuid(),
            modelName: 'category_classification',
            inputSnapshot: JSON.stringify({ title, description }),
            outputSnapshot: JSON.stringify(result),
            confidence: result.confidence,
            createdAt: new Date().toISOString(),
        }).run();
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: 'Classification failed' });
    }
});
// POST /api/ai/recommend-assignment
router.post('/recommend-assignment', validate(recommendSchema), (req, res) => {
    try {
        const { requestId, title, description, sector, category, priority } = req.body;
        const allAgents = db.select().from(schema.agents).all();
        const request = {
            id: requestId || 'temp',
            title: title || '',
            description: description || '',
            sector: sector || 'General',
            category: category || 'General',
            priority: priority || 'medium',
        };
        const result = recommendAgent(request, allAgents);
        // Enrich with agent names
        const enrichedAlts = result.alternativeAgents.map(alt => {
            const agent = allAgents.find(a => a.id === alt.agentId);
            const user = agent?.userId ? db.select().from(schema.users).where(eq(schema.users.id, agent.userId)).get() : null;
            return { ...alt, agentName: user?.name || 'Unknown' };
        });
        const bestAgent = allAgents.find(a => a.id === result.recommendedAgentId);
        const bestUser = bestAgent?.userId ? db.select().from(schema.users).where(eq(schema.users.id, bestAgent.userId)).get() : null;
        // Log model run
        db.insert(schema.aiModelRuns).values({
            id: uuid(),
            modelName: 'agent_recommendation',
            inputSnapshot: JSON.stringify({ request, agentCount: allAgents.length }),
            outputSnapshot: JSON.stringify(result),
            confidence: result.confidence,
            createdAt: new Date().toISOString(),
        }).run();
        res.json({
            ...result,
            recommendedAgentName: bestUser?.name || 'Unknown',
            alternativeAgents: enrichedAlts,
        });
    }
    catch (error) {
        console.error('Recommendation error:', error);
        res.status(500).json({ error: 'Recommendation failed' });
    }
});
// GET /api/ai/model-runs
router.get('/model-runs', (req, res) => {
    try {
        const runs = db.select().from(schema.aiModelRuns).orderBy(desc(schema.aiModelRuns.createdAt)).limit(50).all();
        res.json(runs);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch model runs' });
    }
});
export default router;
//# sourceMappingURL=ai.js.map