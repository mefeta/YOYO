import { useState, useEffect } from 'react';
import { getTeams } from '../api/client';
import { PageHeader, WorkloadRing, StatusBadge } from '../components/ui';
import type { Team } from '../types';

export default function Teams() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTeams().then(d => { setTeams(d); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  return (
    <div>
      <PageHeader title="Teams" subtitle="Operational teams, workload distribution, and performance." />
      {loading ? (
        <div className="g2-2" style={{ gap: 12 }}>
          {[...Array(4)].map((_, i) => <div key={i} className="shimmer" style={{ height: 200 }} />)}
        </div>
      ) : (
        <div className="g2-2" style={{ gap: 12 }}>
          {teams.map((team) => (
            <div key={team.id} className="panel">
              <div className="panel-bd" style={{ padding: 16 }}>
                {/* Header */}
                <div className="flex items-start justify-between" style={{ marginBottom: 12 }}>
                  <div>
                    <h3 style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>{team.name}</h3>
                    {team.description && <div className="mono" style={{ fontSize: 9, color: '#999', marginTop: 2 }}>{team.description}</div>}
                  </div>
                  {team.utilization !== undefined && (
                    <WorkloadRing value={team.utilization} size={32} />
                  )}
                </div>

                {/* Metrics */}
                <div className="g3" style={{ gap: 8, marginBottom: 12 }}>
                  {[
                    { label: 'Agents', value: team.agentCount ?? 0 },
                    { label: 'Open', value: team.openRequestCount ?? 0 },
                    { label: 'Util', value: `${team.utilization ?? 0}%` },
                    { label: 'Sat', value: team.avgSatisfaction ?? '—' },
                  ].map(m => (
                    <div key={m.label} style={{ border: '1px solid #e5e5e3', padding: '8px', textAlign: 'center' }}>
                      <div className="mono" style={{ fontSize: 8, color: '#999', marginBottom: 2 }}>{m.label}</div>
                      <div className="mono" style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a' }}>{m.value}</div>
                    </div>
                  ))}
                </div>

                {/* Workload Bar */}
                {team.totalCapacity && (
                  <div style={{ marginBottom: 12 }}>
                    <div className="flex items-center justify-between" style={{ marginBottom: 4 }}>
                      <span className="mono" style={{ fontSize: 9, color: '#999' }}>Workload</span>
                      <span className="mono" style={{ fontSize: 9, color: '#666' }}>{team.totalWorkload ?? 0} / {team.totalCapacity}</span>
                    </div>
                    <div style={{ height: 6, background: '#e5e5e3' }}>
                      <div style={{ width: `${((team.totalWorkload ?? 0) / team.totalCapacity) * 100}%`, height: '100%', background: '#1a1a1a', transition: 'width 0.3s' }} />
                    </div>
                  </div>
                )}

                {/* Agents list */}
                {team.agents && team.agents.length > 0 && (
                  <div>
                    <div className="mono" style={{ fontSize: 8, color: '#999', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Agents</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {team.agents.map((a: any) => (
                        <div key={a.id} className="flex items-center justify-between" style={{ padding: '4px 8px', border: '1px solid #e5e5e3', background: '#f8f8f6' }}>
                          <div className="flex items-center" style={{ gap: 6 }}>
                            <StatusBadge status={a.availabilityStatus} />
                            <span style={{ fontSize: 11 }}>{a.name || 'Unknown'}</span>
                          </div>
                          <span className="mono" style={{ fontSize: 9, color: '#666' }}>{a.currentWorkload}/{a.capacity}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
