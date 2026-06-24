import { useState, useEffect } from 'react';
import { getRequests, getAgents, assignRequest } from '../api/client';
import { PageHeader, StatusBadge, WorkloadRing } from '../components/ui';
import type { Request, Agent } from '../types';

export default function AIAssignment() {
  const [requests, setRequests] = useState<Request[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Request | null>(null);
  const [assigning, setAssigning] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([getRequests({ status: 'new', limit: '50' }), getAgents()]).then(([reqs, ags]) => {
      setRequests(reqs);
      setAgents(ags);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handleAssign = async (reqId: string, agentId: string) => {
    setAssigning(reqId);
    try {
      await assignRequest(reqId, { agentId });
      setRequests(prev => prev.filter(r => r.id !== reqId));
    } catch {}
    setAssigning(null);
  };

  if (loading) {
    return (
      <div>
        <div className="page-head"><h1>AI Routing</h1><hr className="head-rule" /></div>
        <div className="shimmer" style={{ height: 300 }} />
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="AI Routing" subtitle="Unassigned requests and agent matching." />

      <div className="g2-1">
        {/* Queue */}
        <div className="panel">
          <div className="panel-hdr">
            <h3>Unassigned Queue</h3>
            <span className="mono-label">{requests.length} requests</span>
          </div>
          {requests.length === 0 ? (
            <div className="panel-bd"><div className="mono" style={{ fontSize: 10, color: '#999' }}>No unassigned requests.</div></div>
          ) : (
            <div style={{ maxHeight: 500, overflow: 'auto' }}>
              <table className="tbl">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Title</th>
                    <th>Priority</th>
                    <th>Sector</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.slice(0, 20).map(r => (
                    <tr key={r.id} className={`pointer ${selected?.id === r.id ? 'selected-row' : ''}`} onClick={() => setSelected(r)}>
                      <td className="mono" style={{ fontSize: 10, color: '#999' }}>{r.id}</td>
                      <td style={{ maxWidth: 200 }} className="truncate">{r.title}</td>
                      <td className="mono" style={{ fontSize: 10 }}>{r.priority}</td>
                      <td style={{ fontSize: 12, color: '#666' }}>{r.sector}</td>
                      <td>
                        <StatusBadge status={r.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Agent panel */}
        <div>
          <div className="panel">
            <div className="panel-hdr"><h3>Agents</h3><span className="mono-label">{agents.length} available</span></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 16 }}>
              {agents.map((agent) => {
                const workload = agent.capacity > 0 ? Math.round((agent.currentWorkload / agent.capacity) * 100) : 0;
                return (
                  <div key={agent.id} className="panel-bd" style={{ padding: 12, border: '1px solid #d0d0ce', margin: 0 }}>
                    <div className="flex items-center justify-between" style={{ marginBottom: 8 }}>
                      <div className="flex items-center" style={{ gap: 8 }}>
                        <div style={{ width: 28, height: 28, border: '1px solid #1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'JetBrains Mono, monospace', fontSize: 10, fontWeight: 600 }}>
                          {agent.name?.charAt(0) || '?'}
                        </div>
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 600 }}>{agent.name || 'Unknown'}</div>
                          <div className="mono" style={{ fontSize: 9, color: '#999' }}>{agent.teamName || ''}</div>
                        </div>
                      </div>
                      <StatusBadge status={agent.availabilityStatus} />
                    </div>
                    <div className="flex items-center" style={{ gap: 16 }}>
                      <div className="flex items-center" style={{ gap: 4 }}>
                        <WorkloadRing value={workload} size={28} />
                        <span className="mono" style={{ fontSize: 9, color: '#999' }}>{agent.currentWorkload}/{agent.capacity}</span>
                      </div>
                      <span className="mono" style={{ fontSize: 9, color: '#999' }}>Sat: {agent.satisfactionScore}/5</span>
                      <span className="mono" style={{ fontSize: 9, color: '#999' }}>{agent.avgResolutionTime}h avg</span>
                    </div>
                    <button
                      className="btn btn-sm btn-primary"
                      style={{ marginTop: 8, width: '100%', justifyContent: 'center' }}
                      disabled={assigning !== null || !selected}
                      onClick={() => selected && handleAssign(selected.id, agent.id)}
                    >
                      {assigning === selected?.id ? 'Assigning...' : 'Assign'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
