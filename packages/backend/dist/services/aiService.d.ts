import type { AIAnalysisResult, AssignmentRecommendation } from '../types/index.js';
export declare function analyzeRequest(request: {
    title: string;
    description: string;
    sector?: string;
    category?: string;
}): AIAnalysisResult;
export declare function recommendAgent(request: {
    id: string;
    title: string;
    description: string;
    sector: string;
    category: string;
    priority: string;
}, agentsList: any[]): AssignmentRecommendation;
export declare function generateInsights(requests: any[], agents: any[]): string[];
//# sourceMappingURL=aiService.d.ts.map