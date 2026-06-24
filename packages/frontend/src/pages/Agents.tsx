import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAgents, createAgent, getTeams } from '../api/client';
import { PageHeader, StatusBadge, WorkloadRing, Modal } from '../components/ui';
import { useAppStore } from '../store/appStore';
import type { Agent } from '../types';

export default function Agents() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [teamFilter, setTeamFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [teams, setTeams] = useState<{ id: string; name: string }[]>([]);
  const [form, setForm] = useState({ name: '', email: '', roleTitle: '', skills: '', sectors: '', teamId: '', capacity: '10' });
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const user = useAppStore(s => s.user);

  const loadData = () => {
    setLoading(true);
    Promise.all([
      getAgents(),
      getTeams()
    ]).then(([a, t]) => {
      setAgents(a);
      setTeams(t);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, []);

  const teamNames = [...new Set(agents.map(a => a.teamName || 'Unknown'))];
  const filtered = teamFilter ? agents.filter(a => (a.teamName || '') === teamFilter) : agents;

  const handleCreate = async () => {
    if (!form.name || !form.email || !form.roleTitle) return;
    setSubmitting(true);
    try {
      await createAgent(form);
      setShowModal(false);
      setForm({ name: '', email: '', roleTitle: '', skills: '', sectors: '', teamId: '', capacity: '10' });
      loadData();
    } catch (e) {
      alert('Failed to create agent');
    }
    setSubmitting(false);
  };

  const isAdmin = user?.role === 'admin';

  return (
    <div>
      <PageHeader
        title="Agents"
        subtitle="View agent profiles, workload, and performance metrics."
        action={isAdmin ? (
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            + Add AI Agent
          </button>
        ) : undefined}
      />

      {/* Team Filter */}
      <div className="flex items-center" style={{ gap: 4, marginBottom: 24 }}>
        <button
          onClick={() => setTeamFilter('')}
          className={`btn btn-sm ${!teamFilter ? 'btn-primary' : 'btn-ghost'}`}
        >
          All Teams
        </button>
        {teamNames.map(t => (
          <button
            key={t}
            onClick={() => setTeamFilter(t)}
            className={`btn btn-sm ${teamFilter === t ? 'btn-primary' : 'btn-ghost'}`}
          >
            {t}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="g3" style={{ gap: 16 }}>
          {[...Array(6)].map((_, i) => <div key={i} className="shimmer" style={{ height: 180 }} />)}
        </div>
      ) : (
        <div className="g3" style={{ gap: 16 }}>
          {filtered.map((agent) => {
            const workload = agent.capacity > 0 ? Math.round((agent.currentWorkload / agent.capacity) * 100) : 0;
            const skills = agent.skills ? (typeof agent.skills === 'string' ? JSON.parse(agent.skills) : agent.skills) : [];
            return (
              <div
                key={agent.id}
                className="panel pointer"
                onClick={() => navigate(`/agents/${agent.id}`)}
              >
                <div className="panel-bd" style={{ padding: 16 }}>
                  {/* Header */}
                  <div className="flex items-center justify-between" style={{ marginBottom: 12 }}>
                    <div className="flex items-center" style={{ gap: 10 }}>
                      <div style={{ width: 36, height: 36, border: '1px solid #1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'JetBrains Mono, monospace', fontSize: 12, fontWeight: 600, background: '#fff' }}>
                        {agent.name?.charAt(0) || '?'}
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{agent.name || 'Unknown'}</div>
                        <div className="mono" style={{ fontSize: 9, color: '#999' }}>{agent.roleTitle || agent.role || ''} &middot; {agent.teamName || ''}</div>
                      </div>
                    </div>
                    <StatusBadge status={agent.availabilityStatus} />
                  </div>

                  {/* Stats */}
                  <div className="flex items-center" style={{ gap: 16, marginBottom: 12 }}>
                    <div className="flex items-center" style={{ gap: 6 }}>
                      <WorkloadRing value={workload} size={36} />
                      <span className="mono" style={{ fontSize: 9, color: '#999' }}>{agent.currentWorkload}/{agent.capacity}</span>
                    </div>
                    <span className="mono" style={{ fontSize: 9, color: '#999' }}>Eff: {(agent as any).efficiencyRate || '—'}%</span>
                    <span className="mono" style={{ fontSize: 9, color: '#999' }}>Resolved: {(agent as any).totalResolved || 0}</span>
                    <span className="mono" style={{ fontSize: 9, color: '#999' }}>{agent.avgResolutionTime}h avg</span>
                  </div>

                  {/* Skills */}
                  {skills.length > 0 && (
                    <div className="flex items-center" style={{ gap: 4, flexWrap: 'wrap' }}>
                      {skills.slice(0, 5).map((s: string, i: number) => (
                        <span key={i} className="mono" style={{ fontSize: 8, color: '#666', padding: '2px 6px', border: '1px solid #d0d0ce', background: '#f8f8f6' }}>{s}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add AI Agent Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title="Add AI Agent">
        <div className="frm" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label className="mono" style={{ fontSize: 9, color: '#999', marginBottom: 4, display: 'block' }}>Name</label>
            <input className="input-default" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. AI Assistant" />
          </div>
          <div>
            <label className="mono" style={{ fontSize: 9, color: '#999', marginBottom: 4, display: 'block' }}>Email</label>
            <input className="input-default" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="e.g. ai.assistant@yoyo.ai" />
          </div>
          <div>
            <label className="mono" style={{ fontSize: 9, color: '#999', marginBottom: 4, display: 'block' }}>Role Title</label>
            <input className="input-default" value={form.roleTitle} onChange={e => setForm({ ...form, roleTitle: e.target.value })} placeholder="e.g. AI Support Agent" />
          </div>
          <div>
            <label className="mono" style={{ fontSize: 9, color: '#999', marginBottom: 4, display: 'block' }}>Skills (comma-separated)</label>
            <input className="input-default" value={form.skills} onChange={e => setForm({ ...form, skills: e.target.value })} placeholder="e.g. Billing, Support, Chat" />
          </div>
          <div>
            <label className="mono" style={{ fontSize: 9, color: '#999', marginBottom: 4, display: 'block' }}>Sectors (comma-separated)</label>
            <input className="input-default" value={form.sectors} onChange={e => setForm({ ...form, sectors: e.target.value })} placeholder="e.g. Finance, Technology" />
          </div>
          <div>
            <label className="mono" style={{ fontSize: 9, color: '#999', marginBottom: 4, display: 'block' }}>Team</label>
            <select className="input-default" value={form.teamId} onChange={e => setForm({ ...form, teamId: e.target.value })}>
              <option value="">No team</option>
              {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div>
            <label className="mono" style={{ fontSize: 9, color: '#999', marginBottom: 4, display: 'block' }}>Capacity</label>
            <input className="input-default" type="number" min={1} value={form.capacity} onChange={e => setForm({ ...form, capacity: e.target.value })} />
          </div>
          <div className="flex items-center" style={{ gap: 8, marginTop: 8 }}>
            <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
            <button className="btn btn-primary" disabled={submitting || !form.name || !form.email || !form.roleTitle} onClick={handleCreate}>
              {submitting ? 'Creating...' : 'Create Agent'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
