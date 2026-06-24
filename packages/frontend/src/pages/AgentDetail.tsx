import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { getAgent, getAgentPerformance } from '../api/client';
import { PageHeader, StatusBadge, WorkloadRing } from '../components/ui';
import type { Agent } from '../types';

export default function AgentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [agent, setAgent] = useState<Agent | null>(null);
  const [performance, setPerformance] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    Promise.all([getAgent(id), getAgentPerformance(id)]).then(([a, p]) => {
      setAgent(a);
      setPerformance(p);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {[...Array(4)].map((_, i) => <div key={i} className="shimmer" style={{ height: 80 }} />)}
      </div>
    );
  }

  if (!agent) return <div className="mono" style={{ fontSize: 11, color: '#999' }}>Agent not found.</div>;

  const pct = agent.capacity > 0 ? Math.round((agent.currentWorkload / agent.capacity) * 100) : 0;
  const skills = agent.skills ? (typeof agent.skills === 'string' ? JSON.parse(agent.skills) : agent.skills) : [];
  const sectors = agent.sectors ? (typeof agent.sectors === 'string' ? JSON.parse(agent.sectors) : agent.sectors) : [];

  return (
    <div>
      <PageHeader
        title="Agent Detail"
        subtitle={agent.name || agent.id}
        action={<button onClick={() => navigate('/agents')} className="btn btn-sm btn-ghost">&larr; All Agents</button>}
      />

      <div className="g2-1" style={{ gap: 24 }}>
        {/* Agent Info */}
        <div className="panel">
          <div className="panel-bd" style={{ padding: 20 }}>
            <div className="flex items-center" style={{ gap: 12, marginBottom: 20 }}>
              <div style={{ width: 48, height: 48, border: '1px solid #1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'JetBrains Mono, monospace', fontSize: 16, fontWeight: 600 }}>
                {agent.name?.charAt(0) || '?'}
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 600 }}>{agent.name || 'Unknown'}</div>
                <div className="mono" style={{ fontSize: 10, color: '#666' }}>{agent.roleTitle || agent.role || ''}</div>
                <div className="mono" style={{ fontSize: 9, color: '#999' }}>{agent.teamName || ''}</div>
              </div>
            </div>

            <div className="flex items-center" style={{ gap: 20, marginBottom: 20 }}>
              <WorkloadRing value={pct} size={52} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div className="mono" style={{ fontSize: 10, color: '#666' }}>Workload: <span style={{ color: '#1a1a1a' }}>{agent.currentWorkload}/{agent.capacity}</span></div>
                <div className="mono" style={{ fontSize: 10, color: '#666' }}>Efficiency: <span style={{ color: '#1a1a1a' }}>{(agent as any).efficiencyRate || 0}%</span></div>
                <div className="mono" style={{ fontSize: 10, color: '#666' }}>Resolved: <span style={{ color: '#1a1a1a' }}>{(agent as any).totalResolved || 0} tickets</span></div>
                <div className="mono" style={{ fontSize: 10, color: '#666' }}>SLA compliance: <span style={{ color: '#1a1a1a' }}>{(agent as any).slaComplianceRate || 100}%</span></div>
                <div className="mono" style={{ fontSize: 10, color: '#666' }}>Avg resolution: <span style={{ color: '#1a1a1a' }}>{agent.avgResolutionTime}h</span></div>
                <div className="mono" style={{ fontSize: 10, color: '#666' }}>Satisfaction: <span style={{ color: '#1a1a1a' }}>{agent.satisfactionScore}/5.0</span></div>
              </div>
            </div>

            {skills.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div className="mono" style={{ fontSize: 9, color: '#999', textTransform: 'uppercase', marginBottom: 6, letterSpacing: '0.08em' }}>Skills</div>
                <div className="flex items-center" style={{ gap: 4, flexWrap: 'wrap' }}>
                  {skills.map((s: string, i: number) => (
                    <span key={i} className="mono" style={{ fontSize: 9, color: '#666', padding: '2px 8px', border: '1px solid #d0d0ce', background: '#f8f8f6' }}>{s}</span>
                  ))}
                </div>
              </div>
            )}

            {sectors.length > 0 && (
              <div>
                <div className="mono" style={{ fontSize: 9, color: '#999', textTransform: 'uppercase', marginBottom: 6, letterSpacing: '0.08em' }}>Sectors</div>
                <div className="flex items-center" style={{ gap: 4, flexWrap: 'wrap' }}>
                  {sectors.map((s: string, i: number) => (
                    <span key={i} className="mono" style={{ fontSize: 9, color: '#666', padding: '2px 8px', border: '1px solid #d0d0ce', background: '#f8f8f6' }}>{s}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Performance + Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Performance Chart */}
          <div className="panel">
            <div className="panel-hdr"><h3>Weekly Performance</h3></div>
            <div className="panel-bd">
              {performance?.weeklyData ? (
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={performance.weeklyData}>
                    <XAxis dataKey="day" tick={{ fill: '#999', fontSize: 9 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#999', fontSize: 9 }} axisLine={false} tickLine={false} width={30} />
                    <Tooltip contentStyle={{ background: '#fff', border: '1px solid #1a1a1a', borderRadius: 0, fontSize: 11 }} />
                    <Bar dataKey="resolved" fill="#1a1a1a" radius={[1,1,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ textAlign: 'center', padding: 32, fontSize: 10, color: '#999' }} className="mono">No performance data available.</div>
              )}
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="g3" style={{ gap: 12, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)' }}>
            {[
              { label: 'Resolved', value: performance?.totalResolved || (agent as any).totalResolved || '—' },
              { label: 'Efficiency', value: `${performance?.efficiencyRate || (agent as any).efficiencyRate || 0}%` },
              { label: 'SLA', value: `${performance?.slaComplianceRate || (agent as any).slaComplianceRate || 100}%` },
              { label: 'Avg Time', value: `${performance?.avgResolutionTime || agent.avgResolutionTime}h` },
              { label: 'Utilization', value: `${pct}%` },
            ].map(m => (
              <div key={m.label} className="panel" style={{ textAlign: 'center' }}>
                <div className="panel-bd" style={{ padding: 16 }}>
                  <div className="mono" style={{ fontSize: 9, color: '#999', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>{m.label}</div>
                  <div className="mono" style={{ fontSize: 22, fontWeight: 600, color: '#1a1a1a' }}>{m.value}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Active Requests */}
          <div className="panel">
            <div className="panel-hdr"><h3>Active Requests</h3></div>
            <div className="panel-bd">
              {agent.activeRequests && agent.activeRequests.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {agent.activeRequests.map((r: any) => (
                    <div key={r.id} className="pointer" style={{ padding: '8px 0', borderBottom: '1px solid #e5e5e3', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }} onClick={() => navigate(`/requests/${r.id}`)}>
                      <div>
                        <div style={{ fontSize: 12 }}>{r.title}</div>
                        <div className="mono" style={{ fontSize: 9, color: '#999' }}>{r.id}</div>
                      </div>
                      <StatusBadge status={r.status} />
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: 24, fontSize: 10, color: '#999' }} className="mono">No active requests.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
