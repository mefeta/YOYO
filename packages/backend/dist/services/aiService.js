const SKILL_KEYWORDS = {
    'Delivery Delay': ['kargo', 'teslimat', 'sevkiyat', 'gümrük', 'adres', 'gecikme', 'gönderi', 'lojistik', 'nakliye'],
    'Billing Problem': ['fatura', 'ücret', 'ödeme', 'banka', 'muhasebe', 'vergi', 'beyanname', 'matrah', 'eft'],
    'Technical Failure': ['santral', 'pbx', 'mobil', 'aktivasyon', 'ağ', 'fiber', 'sistem', 'performans', 'hms', 'bakım', 'mr', 'cihaz', 'stok', 'sayım', 'veri'],
    'Campaign Approval': ['kampanya', 'onay', 'bütçe', 'lansman', 'brief', 'kreatif', 'reklam'],
    'Customer Complaint': ['şikayet', 'memnuniyetsiz', 'kriz', 'sosyalmedya', 'müşteri', 'mağdur'],
    'Contract Update': ['sözleşme', 'protokol', 'tedarikçi', 'fiyat', 'numara', 'taşıma', 'mağaza', 'açılış'],
    'Outage Report': ['kesinti', 'fiber', 'kadıköy', 'arız'],
    'Data Request': ['rapor', 'analiz', 'seo', 'anket', 'sla', 'kredi', 'değerlendirme'],
    'Refund Request': ['iade', 'para iadesi'],
    'Compliance Question': ['gdpr', 'veri', 'silme', 'yasal', 'vergi', 'beyanname', 'danışmanlık', 'uyum'],
};
const SECTOR_KEYWORDS = {
    Logistics: ['kargo', 'lojistik', 'teslimat', 'sevkiyat', 'gönderi', 'depo', 'nakliye', 'gümrük', 'adres'],
    Telecom: ['fiber', 'mobil', 'hat', 'santral', 'internet', 'telekom', 'operatör', 'voip'],
    Marketing: ['kampanya', 'reklam', 'sosyalmedya', 'seo', 'marka', 'pazarlama', 'kreatif', 'lansman', 'brief'],
    Finance: ['fatura', 'ödeme', 'banka', 'vergi', 'muhasebe', 'kredi', 'beyanname', 'eft', 'matrah'],
    Retail: ['mağaza', 'stok', 'iade', 'perakende', 'tedarikçi', 'ürün'],
    Healthcare: ['hasta', 'randevu', 'medikal', 'hms', 'mr', 'bakım', 'sağlık', 'anket'],
};
function scoreText(text, keywords) {
    const lower = text.toLowerCase();
    let score = 0;
    for (const kw of keywords) {
        const regex = new RegExp(kw.toLowerCase(), 'gi');
        const matches = lower.match(regex);
        if (matches)
            score += matches.length * 10;
    }
    return Math.min(score, 100);
}
function detectCategory(title, description) {
    const fullText = `${title} ${description}`.toLowerCase();
    let bestCategory = 'General';
    let bestScore = 0;
    for (const [category, keywords] of Object.entries(SKILL_KEYWORDS)) {
        const score = scoreText(fullText, keywords);
        if (score > bestScore) {
            bestScore = score;
            bestCategory = category;
        }
    }
    return bestCategory;
}
function detectSector(title, description) {
    const fullText = `${title} ${description}`.toLowerCase();
    let bestSector = 'General';
    let bestScore = 0;
    for (const [sector, keywords] of Object.entries(SECTOR_KEYWORDS)) {
        const score = scoreText(fullText, keywords);
        if (score > bestScore) {
            bestScore = score;
            bestSector = sector;
        }
    }
    return bestSector;
}
function detectSentiment(text) {
    const lower = text.toLowerCase();
    const negativeWords = ['şikayet', 'sorun', 'gecikme', 'mağdur', 'başarısız', 'kesinti', 'tehdit', 'fesih', 'kriz', 'olumsuz', 'hata', 'eksik', 'kötü', 'berbat', 'rezalet'];
    const angryWords = ['tehdit', 'fesih', 'kriz', 'rezalet', 'berbat', 'sinir', 'öfkeli', 'dava'];
    const positiveWords = ['teşekkür', 'memnun', 'olumlu', 'başarılı', 'harika', 'iyi', 'fırsat', 'güzel'];
    let negScore = negativeWords.filter(w => lower.includes(w)).length;
    let angryScore = angryWords.filter(w => lower.includes(w)).length;
    let posScore = positiveWords.filter(w => lower.includes(w)).length;
    if (angryScore > 0)
        return { sentiment: 'angry', score: 10 + angryScore * 20 };
    if (negScore > 2)
        return { sentiment: 'negative', score: 5 + negScore * 15 };
    if (posScore > 2)
        return { sentiment: 'positive', score: 10 + posScore * 10 };
    if (negScore > 0)
        return { sentiment: 'negative', score: negScore * 10 };
    if (posScore > 0)
        return { sentiment: 'positive', score: posScore * 5 };
    return { sentiment: 'neutral', score: 50 };
}
function detectUrgency(title, description) {
    const fullText = `${title} ${description}`.toLowerCase();
    const urgentWords = ['acil', 'hemen', 'kritik', 'önemli', 'tehdit', 'fesih', 'kesinti', 'kriz', 'derhal', 'son gün', 'süre'];
    const mediumWords = ['gecikme', 'sorun', 'yardım', 'destek', 'problem', 'talebi'];
    let urgency = 50;
    urgentWords.forEach(w => {
        if (fullText.includes(w))
            urgency += 15;
    });
    mediumWords.forEach(w => {
        if (fullText.includes(w))
            urgency += 5;
    });
    return Math.min(urgency, 100);
}
function detectPriority(urgency, sentiment) {
    if (urgency >= 80 || sentiment === 'angry')
        return 'critical';
    if (urgency >= 60)
        return 'high';
    if (urgency >= 40)
        return 'medium';
    return 'low';
}
function calculateSLARisk(priority, urgency) {
    const base = priority === 'critical' ? 80 : priority === 'high' ? 60 : priority === 'medium' ? 30 : 10;
    return Math.min(base + urgency * 0.2, 100);
}
function estimateResolutionTime(category, priority) {
    const base = {
        'Delivery Delay': 120,
        'Billing Problem': 90,
        'Technical Failure': 180,
        'Campaign Approval': 240,
        'Customer Complaint': 60,
        'Contract Update': 300,
        'Outage Report': 45,
        'Data Request': 180,
        'Refund Request': 60,
        'Compliance Question': 240,
    };
    const time = base[category] || 120;
    const multiplier = priority === 'critical' ? 0.5 : priority === 'high' ? 0.7 : priority === 'medium' ? 1 : 1.5;
    return Math.round(time * multiplier);
}
function generateSummary(category, sentiment, priority) {
    const sentimentText = sentiment === 'angry' ? 'negative and high-tension' : sentiment === 'negative' ? 'negative' : sentiment === 'positive' ? 'positive' : 'neutral';
    return `${category} category, ${priority} priority, ${sentimentText} sentiment request.`;
}
function generateExplanation(category, priority, sentiment, urgency, tags) {
    const parts = [];
    parts.push(`Request classified as "${category}"`);
    parts.push(`priority level: ${priority}`);
    if (sentiment !== 'neutral')
        parts.push(`customer sentiment: ${sentiment}`);
    if (urgency > 70)
        parts.push(`high urgency score (${Math.round(urgency)}/100)`);
    if (tags.length > 0)
        parts.push(`keywords: ${tags.slice(0, 3).join(', ')}`);
    return parts.join('. ') + '.';
}
function calculateSkillMatch(agent, category, sector) {
    const agentSkills = JSON.parse(agent.skills || '[]');
    const agentSectors = JSON.parse(agent.sectors || '[]');
    const catLower = category.toLowerCase();
    const sectorLower = sector.toLowerCase();
    let skillScore = 0;
    for (const sk of agentSkills) {
        if (catLower.includes(sk.toLowerCase().split(' ')[0]))
            skillScore += 25;
    }
    let sectorScore = 0;
    for (const sec of agentSectors) {
        if (sec.toLowerCase() === sectorLower)
            sectorScore += 40;
        if (sectorLower.includes(sec.toLowerCase()))
            sectorScore += 20;
    }
    return Math.min(skillScore + sectorScore + 20, 100);
}
function calculateWorkloadScore(agent) {
    const workload = agent.currentWorkload || 0;
    const capacity = agent.capacity || 10;
    const ratio = workload / capacity;
    return Math.max(0, Math.round((1 - ratio) * 100));
}
function calculateAvailabilityScore(agent) {
    const status = agent.availabilityStatus || 'offline';
    const scores = { available: 100, busy: 40, away: 20, offline: 0 };
    return scores[status] || 0;
}
function calculateHistoricalScore(agent) {
    const satisfaction = agent.satisfactionScore || 0;
    const avgTime = agent.avgResolutionTime || 10;
    const timeScore = Math.max(0, 100 - (avgTime / 10) * 20);
    return Math.round((satisfaction / 5) * 50 + timeScore * 0.5);
}
function calculateSLAFitScore(agent, priority) {
    const avgTime = agent.avgResolutionTime || 5;
    const target = priority === 'critical' ? 1 : priority === 'high' ? 3 : 5;
    if (avgTime <= target)
        return 100;
    return Math.max(0, Math.round(100 - ((avgTime - target) / target) * 30));
}
// ============ EXPORTED FUNCTIONS ============
export function analyzeRequest(request) {
    const fullText = `${request.title} ${request.description}`;
    const detectedCategory = detectCategory(request.title, request.description);
    const detectedSector = detectSector(request.title, request.description) || request.sector || 'General';
    const { sentiment, score: sentimentScore } = detectSentiment(fullText);
    const urgency = detectUrgency(request.title, request.description);
    const priority = detectPriority(urgency, sentiment);
    const slaRisk = calculateSLARisk(priority, urgency);
    const estimatedMinutes = estimateResolutionTime(detectedCategory, priority);
    const summary = generateSummary(detectedCategory, sentiment, priority);
    const explanation = generateExplanation(detectedCategory, priority, sentiment, urgency, []);
    const tags = SKILL_KEYWORDS[detectedCategory]?.slice(0, 3).map(t => t.toLowerCase()) || [];
    const riskFlags = [];
    if (slaRisk > 70)
        riskFlags.push('High SLA risk');
    if (sentiment === 'angry')
        riskFlags.push('Customer angry - priority intervention');
    if (urgency > 80)
        riskFlags.push('Critical urgency level');
    if (sentiment === 'negative')
        riskFlags.push('Negative customer experience risk');
    return {
        predictedCategory: detectedCategory,
        predictedSubcategory: undefined,
        priority,
        sentiment,
        confidence: Math.round(60 + Math.min(urgency, 30) + (detectedCategory !== 'General' ? 10 : 0)),
        urgencyScore: urgency,
        slaRiskScore: Math.round(slaRisk * 10) / 10,
        businessImpactScore: Math.round((urgency * 0.5 + (sentiment === 'angry' ? 40 : 0) + (priority === 'critical' ? 30 : 0)) / 1.2),
        estimatedResolutionMinutes: estimatedMinutes,
        summary,
        explanation,
        suggestedTags: tags,
        suggestedTeamId: undefined,
        riskFlags,
        recommendedNextActions: [
            priority === 'critical' ? 'Assign immediately and notify management' : 'Assign based on priority level',
            sentiment !== 'neutral' ? 'Communicate considering customer sentiment' : 'Apply standard communication procedure',
            slaRisk > 60 ? 'Monitor SLA timeline closely' : 'Apply standard SLA procedure',
        ],
    };
}
export function recommendAgent(request, agentsList) {
    const sector = detectSector(request.title, request.description) || request.sector;
    const category = detectCategory(request.title, request.description) || request.category;
    const scoredAgents = agentsList.map((agent) => {
        const skillMatch = calculateSkillMatch(agent, category, sector);
        const availability = calculateAvailabilityScore(agent);
        const workloadBalance = calculateWorkloadScore(agent);
        const historicalSuccess = calculateHistoricalScore(agent);
        const sectorExperience = skillMatch; // reuse skill match for sector expertise
        const slaFit = calculateSLAFitScore(agent, request.priority);
        const totalScore = skillMatch * 0.30 +
            availability * 0.20 +
            workloadBalance * 0.15 +
            historicalSuccess * 0.15 +
            sectorExperience * 0.10 +
            slaFit * 0.10;
        const parts = [];
        parts.push(`Skill match: ${skillMatch}%`);
        if (availability > 60)
            parts.push('currently available');
        parts.push(`workload: ${100 - workloadBalance}% utilized`);
        parts.push(`historical success: ${Math.round(historicalSuccess)}/100`);
        parts.push(`SLA fit: ${slaFit}%`);
        return {
            agentId: agent.id,
            score: Math.round(totalScore),
            skillMatch: Math.round(skillMatch),
            availability: Math.round(availability),
            workloadBalance: Math.round(workloadBalance),
            historicalSuccess: Math.round(historicalSuccess),
            sectorExperience: Math.round(sectorExperience),
            slaFit: Math.round(slaFit),
            explanation: parts.join(', ') + '.',
        };
    });
    scoredAgents.sort((a, b) => b.score - a.score);
    const best = scoredAgents[0];
    const alternatives = scoredAgents.slice(1, 4);
    return {
        requestId: request.id,
        recommendedAgentId: best.agentId,
        recommendedTeamId: undefined,
        score: best.score,
        confidence: Math.round((best.score / 100) * 85),
        explanation: best.explanation,
        alternativeAgents: alternatives,
    };
}
export function generateInsights(requests, agents) {
    const insights = [];
    // Count by sector
    const sectorCounts = {};
    for (const r of requests) {
        sectorCounts[r.sector] = (sectorCounts[r.sector] || 0) + 1;
    }
    const topSector = Object.entries(sectorCounts).sort((a, b) => b[1] - a[1])[0];
    if (topSector) {
        insights.push(`${topSector[0]} requests increased by ${Math.round((topSector[1] / requests.length) * 100)}% this week.`);
    }
    // SLA risk by category
    const slaRisk = {};
    for (const r of requests) {
        if (r.priority === 'critical' || r.priority === 'high') {
            slaRisk[r.category] = (slaRisk[r.category] || 0) + 1;
        }
    }
    const topRisk = Object.entries(slaRisk).sort((a, b) => b[1] - a[1])[0];
    if (topRisk) {
        insights.push(`${topRisk[0]} requests have the highest SLA risk.`);
    }
    // Overloaded agents
    for (const a of agents) {
        const load = a.currentWorkload || 0;
        const cap = a.capacity || 10;
        if (load / cap > 0.7) {
            const agentName = a.name || 'An agent';
            insights.push(`${agentName} is overloaded (${Math.round((load / cap) * 100)}%); reassignment recommended.`);
        }
    }
    // Category spike
    const categoryCounts = {};
    for (const r of requests) {
        categoryCounts[r.category] = (categoryCounts[r.category] || 0) + 1;
    }
    const topCat = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])[0];
    if (topCat) {
        insights.push(`Abnormal increase detected in ${topCat[0]} category.`);
    }
    insights.push(`Request volume is being monitored for trends.`);
    return insights;
}
//# sourceMappingURL=aiService.js.map