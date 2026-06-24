import { describe, it, expect } from 'vitest';
import { analyzeRequest, recommendAgent } from '../src/services/aiService.js';

describe('AI Service - analyzeRequest', () => {
  it('should classify a logistics delivery delay request', () => {
    const result = analyzeRequest({
      title: 'Kargo takip numarası güncellenmiyor',
      description: '3 gündür kargonuzun takip numarası sistemde görünmüyor. Müşterimiz sürekli şikayet ediyor.',
    });
    expect(result.predictedCategory).toBe('Delivery Delay');
    expect(result.priority).toBe('high');
    expect(result.sentiment).toBe('negative');
    expect(result.confidence).toBeGreaterThan(60);
    expect(result.riskFlags.length).toBeGreaterThan(0);
  });

  it('should classify a critical telecom outage', () => {
    const result = analyzeRequest({
      title: 'Fiber internet kesintisi - Kadıköy',
      description: 'Kadıköy bölgesinde geniş çaplı fiber internet kesintisi yaşanıyor. 200+ abone etkilendi. Acil müdahale gerekiyor.',
    });
    expect(result.predictedCategory).toBe('Outage Report');
    expect(result.sentiment).toBe('negative');
    expect(result.riskFlags.length).toBeGreaterThan(0);
  });

  it('should detect angry sentiment', () => {
    const result = analyzeRequest({
      title: 'Sözleşme fesih tehdidi',
      description: 'Müşterimiz siparişinin üçüncü kez geciktiğini ve sözleşmeyi feshetmekle tehdit ettiğini bildirdi. Bu bir rezalet!',
    });
    expect(result.sentiment).toBe('angry');
    expect(result.priority).toBe('critical');
  });

  it('should calculate urgency correctly', () => {
    const result = analyzeRequest({
      title: 'Acil yardım',
      description: 'Kritik bir sorun var, hemen müdahale edilmesi gerekiyor.',
    });
    expect(result.urgencyScore).toBeGreaterThan(70);
    expect(result.priority).toBe('critical');
  });

  it('should provide recommended next actions', () => {
    const result = analyzeRequest({
      title: 'Test talebi',
      description: 'Basit bir test talebi.',
    });
    expect(result.recommendedNextActions.length).toBeGreaterThan(0);
  });
});

describe('AI Service - recommendAgent', () => {
  const mockAgents = [
    { id: '1', skills: '["Lojistik Yönetimi","Kargo Takip"]', sectors: '["Logistics"]', availabilityStatus: 'available', currentWorkload: 3, capacity: 10, avgResolutionTime: 2.1, satisfactionScore: 4.8 },
    { id: '2', skills: '["Ağ Yönetimi","Fiber"]', sectors: '["Telecom"]', availabilityStatus: 'busy', currentWorkload: 8, capacity: 10, avgResolutionTime: 4.5, satisfactionScore: 3.9 },
    { id: '3', skills: '["Muhasebe","Fatura"]', sectors: '["Finance"]', availabilityStatus: 'available', currentWorkload: 5, capacity: 10, avgResolutionTime: 3.5, satisfactionScore: 4.7 },
  ];

  it('should recommend the best agent based on skill match', () => {
    const result = recommendAgent(
      { id: 'REQ-001', title: 'Kargo gecikmesi', description: 'Kargo takip sorunu', sector: 'Logistics', category: 'Delivery Delay', priority: 'high' },
      mockAgents
    );
    expect(result.recommendedAgentId).toBe('1');
    expect(result.score).toBeGreaterThan(50);
  });

  it('should return alternative agents', () => {
    const result = recommendAgent(
      { id: 'REQ-002', title: 'Fatura sorunu', description: 'Fatura ödeme hatası', sector: 'Finance', category: 'Billing Problem', priority: 'medium' },
      mockAgents
    );
    expect(result.recommendedAgentId).toBe('3');
    expect(result.alternativeAgents.length).toBeGreaterThan(0);
  });

  it('should include score breakdown in explanation', () => {
    const result = recommendAgent(
      { id: 'REQ-003', title: 'Ağ kesintisi', description: 'Fiber arıza', sector: 'Telecom', category: 'Technical Failure', priority: 'critical' },
      mockAgents
    );
    expect(result.explanation).toBeTruthy();
    expect(result.alternativeAgents[0]).toHaveProperty('skillMatch');
    expect(result.alternativeAgents[0]).toHaveProperty('availability');
    expect(result.alternativeAgents[0]).toHaveProperty('workloadBalance');
  });
});

// predictSLARisk test removed as the fake feature was deleted.
