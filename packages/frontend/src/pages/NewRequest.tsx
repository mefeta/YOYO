import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { createRequest, aiClassify, aiRecommend } from '../api/client';
import { PageHeader, ConfidenceMeter } from '../components/ui';
import type { AIAnalysisResult } from '../types';

const STEPS = ['Details', 'Content', 'AI Analysis', 'Assignment', 'Submit'];

export default function NewRequest() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    title: '', description: '', sector: 'Logistics', channel: 'email',
    customerName: '', customerCompany: '',
  });
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AIAnalysisResult | null>(null);
  const [recommendation, setRecommendation] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleAnalyze = async () => {
    setAnalyzing(true);
    setStep(3);
    try {
      const res = await aiClassify(form.title, form.description);
      setAnalysis(res);
      const rec = await aiRecommend({
        title: form.title,
        description: form.description,
        sector: form.sector,
        category: res.predictedCategory,
        priority: res.priority,
      });
      setRecommendation(rec);
      setStep(4);
    } catch (err) {
      console.error(err);
      setStep(2);
    }
    setAnalyzing(false);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const res = await createRequest(form);
      navigate(`/requests/${res.id}`);
    } catch (err) {
      console.error(err);
      setSubmitting(false);
    }
  };

  const update = (key: string, val: string) => setForm(prev => ({ ...prev, [key]: val }));

  return (
    <div>
      <PageHeader
        title="New Request"
        subtitle="Multi-step request intake with AI analysis."
        action={<button onClick={() => navigate('/requests')} className="btn btn-secondary text-[10px]">Cancel</button>}
      />

      {/* Step Indicator */}
      <div className="flex items-center gap-1 mb-5">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-1 flex-1">
            <div className={`flex items-center gap-1.5 px-2 py-1 rounded text-[9px] font-mono ${
              step > i + 1 ? 'text-success bg-success/10' :
              step === i + 1 ? 'text-accent bg-accent/10' : 'text-text-dim bg-surface'
            }`}>
              <span>{step > i + 1 ? '✓' : i + 1}</span>
              <span className="hidden sm:inline">{s}</span>
            </div>
            {i < STEPS.length - 1 && <div className="flex-1 h-px bg-border" />}
          </div>
        ))}
      </div>

      <div className="max-w-2xl mx-auto">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="bg-surface border border-border rounded-lg p-5 space-y-4">
              <h2 className="text-sm font-semibold text-text-main">Customer & Sector</h2>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-mono text-text-dim uppercase mb-1">Customer Name</label>
                  <input type="text" value={form.customerName} onChange={e => update('customerName', e.target.value)} className="input-default text-xs" placeholder="Jane Smith" />
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-text-dim uppercase mb-1">Company</label>
                  <input type="text" value={form.customerCompany} onChange={e => update('customerCompany', e.target.value)} className="input-default text-xs" placeholder="Global Logistics" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-mono text-text-dim uppercase mb-1">Sector</label>
                  <select value={form.sector} onChange={e => update('sector', e.target.value)} className="input-default text-xs">
                    {['Logistics', 'Telecom', 'Marketing', 'Finance', 'Retail', 'Healthcare'].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-text-dim uppercase mb-1">Channel</label>
                  <select value={form.channel} onChange={e => update('channel', e.target.value)} className="input-default text-xs">
                    {['email', 'phone', 'chat', 'portal', 'api'].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex justify-end">
                <button onClick={() => setStep(2)} className="btn btn-primary">Next →</button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="bg-surface border border-border rounded-lg p-5 space-y-4">
              <h2 className="text-sm font-semibold text-text-main">Request Content</h2>
              <div>
                <label className="block text-[10px] font-mono text-text-dim uppercase mb-1">Title</label>
                <input type="text" value={form.title} onChange={e => update('title', e.target.value)} className="input-default text-xs" placeholder="Package tracking issue" />
              </div>
              <div>
                <label className="block text-[10px] font-mono text-text-dim uppercase mb-1">Description</label>
                <textarea value={form.description} onChange={e => update('description', e.target.value)} rows={5} className="input-default text-xs resize-none" placeholder="Describe the request in detail..." />
              </div>
              <div className="flex justify-between">
                <button onClick={() => setStep(1)} className="btn btn-secondary">← Back</button>
                <button onClick={handleAnalyze} className="btn btn-primary flex items-center gap-1.5">Analyze with AI →</button>
              </div>
            </motion.div>
          )}

          {step === 3 && analyzing && (
            <motion.div key="s3a" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="bg-surface border border-border rounded-lg p-8 text-center space-y-4">
              <div className="scan-line max-w-[200px] mx-auto h-20 flex items-center justify-center">
                <span className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
              </div>
              <h2 className="text-sm font-semibold text-text-main">AI Analysis in Progress</h2>
              <p className="text-xs text-text-muted max-w-sm mx-auto">YOYO is analyzing request content, detecting category, urgency, sentiment, and SLA risk.</p>
              <div className="max-w-xs mx-auto space-y-2">
                {['Scanning keywords...', 'Detecting category...', 'Calculating urgency...', 'Assessing SLA risk...'].map((msg, i) => (
                  <div key={i} className="flex items-center gap-2 text-[10px] text-text-dim font-mono animate-fade-in" style={{ animationDelay: `${i * 0.4}s` }}>
                    <span className="w-1 h-1 rounded-full bg-accent-cyan animate-pulse-glow" />
                    {msg}
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {step === 4 && analysis && !submitting && (
            <motion.div key="s4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
              {/* AI Analysis Results */}
              <div className="bg-surface border border-border rounded-lg p-5">
                <div className="flex items-center gap-2 mb-4">
                  <span className="w-2 h-2 rounded-full bg-success animate-pulse-glow" />
                  <h2 className="text-sm font-semibold text-text-main">AI Analysis Complete</h2>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                  {[
                    { label: 'Category', value: analysis.predictedCategory, color: '#F2B84B' },
                    { label: 'Priority', value: analysis.priority, color: analysis.priority === 'critical' ? '#FF5A3C' : '#F2B84B' },
                    { label: 'Sentiment', value: analysis.sentiment, color: analysis.sentiment === 'positive' ? '#62D26F' : '#FF5A3C' },
                    { label: 'Est. Time', value: `${analysis.estimatedResolutionMinutes}m`, color: '#39E6D2' },
                  ].map(d => (
                    <div key={d.label} className="bg-bg border border-border rounded-lg p-3 text-center">
                      <div className="text-[9px] font-mono text-text-dim">{d.label}</div>
                      <div className="text-sm font-bold font-mono mt-1" style={{ color: d.color }}>{d.value}</div>
                    </div>
                  ))}
                </div>
                <ConfidenceMeter value={analysis.confidence} label="Classification Confidence" />
              </div>

              {/* Assignment Preview */}
              {recommendation && (
                <div className="bg-surface border border-border rounded-lg p-5">
                  <h2 className="text-sm font-semibold text-text-main mb-3">Recommended Assignment</h2>
                  <div className="bg-accent/[0.04] border border-accent/20 rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold text-sm">
                        {recommendation.recommendedAgentName?.charAt(0) || '—'}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-text-main">{recommendation.recommendedAgentName || 'Unknown Agent'}</div>
                        <div className="text-[10px] font-mono text-text-dim">Match: {recommendation.score}% · Confidence: {recommendation.confidence}%</div>
                      </div>
                    </div>
                    <ConfidenceMeter value={recommendation.score || 0} label="Agent Match Score" />
                  </div>
                </div>
              )}

              <div className="flex justify-between">
                <button onClick={() => setStep(2)} className="btn btn-secondary">Manual Override</button>
                <button onClick={handleSubmit} className="btn btn-primary">Accept Analysis & Submit</button>
              </div>
            </motion.div>
          )}

          {submitting && (
            <motion.div key="submitting" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="bg-surface border border-border rounded-lg p-8 text-center space-y-4">
              <div className="max-w-[200px] mx-auto h-20 flex items-center justify-center">
                <span className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
              </div>
              <h2 className="text-sm font-semibold text-text-main">Submitting Request</h2>
              <p className="text-xs text-text-muted">Please wait while the request is being created and recorded in the system.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
