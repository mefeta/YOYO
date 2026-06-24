import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { getAnalyticsOverview, getRequests } from '../api/client';
import { PageHeader, MetricCard, StatusBadge } from '../components/ui';
import type { AnalyticsOverview, Request } from '../types';

export default function Dashboard() {
  const [data, setData] = useState<AnalyticsOverview | null>(null);
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
      getAnalyticsOverview(),
      getRequests({ status: 'new', limit: '10' }),
    ]).then(([overview, reqs]) => {
      setData(overview);
      setRequests(reqs);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div>
        <div className="page-head"><h1>Command</h1><hr className="head-rule" /></div>
        <div className="kpi-grid">
          {[...Array(6)].map((_, i) => <div key={i} className="shimmer" style={{ height: 80 }} />)}
        </div>
      </div>
    );
  }

  if (!data) return <div className="mono" style={{ fontSize: 11, color: '#999' }}>Unable to load command center data.</div>;

  const priorityColors: Record<string, string> = { critical: '#1a1a1a', high: '#555', medium: '#999', low: '#ccc' };

  return (
    <div>
      <PageHeader title="Command" subtitle="Live operational pulse across requests, agents, SLA risk and AI routing." />

      {/* KPI Grid */}
      <div className="kpi-grid">
        <MetricCard label="Open Requests" value={data.totalOpenRequests.toLocaleString()} subtitle="Awaiting resolution" />
        <MetricCard label="New Today" value={data.newRequestsToday} subtitle="Last 24 hours" />
        <MetricCard label="Resolved" value={data.resolvedRequests.toLocaleString()} subtitle="Total resolved" />
        <MetricCard label="Avg Response" value={`${data.avgResponseTimeMinutes}m`} subtitle="First response time" />
        <MetricCard label="Agents" value={data.totalAgents} subtitle={`${data.busyAgents} busy`} />
        <MetricCard label="Utilization" value={`${data.agentUtilization}%`} subtitle="Agent utilization" />
      </div>

      {/* Black Stats Strip */}
      <div className="stats-strip" style={{ marginBottom: 48 }}>
        <div className="stat">
          <div className="stat-val">{data.totalOpenRequests.toLocaleString()}</div>
          <div className="stat-line" />
          <div className="stat-lbl">Open Requests</div>
        </div>
        <div className="stat">
          <div className="stat-val">{data.resolvedRequests.toLocaleString()}</div>
          <div className="stat-line" />
          <div className="stat-lbl">Resolved</div>
        </div>
        <div className="stat">
          <div className="stat-val">{data.totalAgents}</div>
          <div className="stat-line" />
          <div className="stat-lbl">Agents</div>
        </div>
        <div className="stat">
          <div className="stat-val">{data.avgResponseTimeMinutes}m</div>
          <div className="stat-line" />
          <div className="stat-lbl">Avg Response</div>
        </div>
      </div>

      <div className="g2-1" style={{ marginBottom: 48 }}>
        {/* Live Queue */}
        <div className="panel" style={{ marginBottom: 24 }}>
          <div className="panel-hdr">
            <h3>Live Queue</h3>
            <span className="mono-label">{requests.length} new</span>
            <button className="btn btn-sm btn-ghost" onClick={() => navigate('/requests')}>View all →</button>
          </div>
          <div style={{ maxHeight: 260, overflow: 'auto' }}>
            <table className="tbl">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Title</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Customer</th>
                </tr>
              </thead>
              <tbody>
                {requests.slice(0, 8).map(r => (
                  <tr key={r.id} className="pointer" onClick={() => navigate(`/requests/${r.id}`)}>
                    <td className="mono" style={{ fontSize: 10, color: '#999' }}>{r.id}</td>
                    <td style={{ maxWidth: 200 }} className="truncate">{r.title}</td>
                    <td className="mono" style={{ fontSize: 10 }}>{r.priority}</td>
                    <td><StatusBadge status={r.status} /></td>
                    <td style={{ fontSize: 12, color: '#666' }}>{r.customerName || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right column */}
        <div>
          {/* Volume Trend Chart */}
          <div className="panel" style={{ marginBottom: 24 }}>
            <div className="panel-hdr"><h3>Volume Trend</h3><span className="mono-label">7 days</span></div>
            <div className="panel-bd">
              <ResponsiveContainer width="100%" height={140}>
                <BarChart data={data.requestVolumeTrend}>
                  <XAxis dataKey="date" tick={{ fill: '#999', fontSize: 9 }} tickFormatter={v => v.slice(5)} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#999', fontSize: 9 }} axisLine={false} tickLine={false} width={20} />
                  <Tooltip contentStyle={{ background: '#fff', border: '1px solid #1a1a1a', borderRadius: 0, fontSize: 11 }} />
                  <Bar dataKey="count" fill="#1a1a1a" radius={[1,1,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Priority */}
          <div className="panel">
            <div className="panel-hdr"><h3>Priority</h3></div>
            <div className="panel-bd">
              <ResponsiveContainer width="100%" height={140}>
                <PieChart>
                  <Pie data={data.priorityDistribution} cx="50%" cy="50%" innerRadius={35} outerRadius={55} dataKey="count" nameKey="priority">
                    {data.priorityDistribution.map((e, i) => (
                      <Cell key={i} fill={priorityColors[e.priority] || '#ccc'} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#fff', border: '1px solid #1a1a1a', borderRadius: 0 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex items-center" style={{ gap: 12, justifyContent: 'center', marginTop: 8 }}>
                {data.priorityDistribution.map(p => (
                  <span key={p.priority} className="mono" style={{ fontSize: 8, color: '#999', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ width: 6, height: 6, display: 'inline-block', background: priorityColors[p.priority] || '#ccc' }} />
                    {p.priority}: {p.count}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Insights */}
      {data.insights && data.insights.length > 0 && (
        <div className="panel">
          <div className="panel-hdr"><h3>AI Insights</h3></div>
          <div className="panel-bd">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {data.insights.map((insight, i) => (
                <div key={i} className="mono" style={{ fontSize: 10, color: '#444', padding: '8px 12px', border: '1px solid #e5e5e3', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 4, height: 4, background: '#1a1a1a', display: 'inline-block' }} />
                  {insight}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
