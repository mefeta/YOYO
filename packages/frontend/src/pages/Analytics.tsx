import { useState, useEffect } from 'react';
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer
} from 'recharts';
import { getAnalyticsTrends, getAnalyticsCategories, getSLA, getAgentUtilization } from '../api/client';
import { PageHeader } from '../components/ui';

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'categories', label: 'Categories' },
  { id: 'sla', label: 'SLA' },
  { id: 'agents', label: 'Agents' },
];

export default function Analytics() {
  const [tab, setTab] = useState('overview');
  const [trends, setTrends] = useState<any[]>([]);
  const [categories, setCategories] = useState<any>(null);
  const [sla, setSla] = useState<any>(null);
  const [utilization, setUtilization] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getAnalyticsTrends(),
      getAnalyticsCategories(),
      getSLA(),
      getAgentUtilization(),
    ]).then(([t, c, s, u]) => {
      setTrends(t || []);
      setCategories(c);
      setSla(s);
      setUtilization(u || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) {
    return <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {[...Array(4)].map((_, i) => <div key={i} className="shimmer" style={{ height: 160 }} />)}
    </div>;
  }

  return (
    <div>
      <PageHeader title="Analytics" subtitle="Data-driven insights across operations, SLA, and agent performance." />

      {/* Tabs */}
      <div className="flex items-center" style={{ gap: 2, borderBottom: '1px solid #d0d0ce', marginBottom: 24 }}>
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`btn btn-sm ${tab === t.id ? 'btn-primary' : 'btn-ghost'}`}
            style={{ borderBottom: tab === t.id ? '2px solid #1a1a1a' : '2px solid transparent', borderRadius: 0, marginBottom: -1 }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* KPI Grid */}
          <div className="g3" style={{ gap: 12 }}>
            {sla && ['totalCompliance', 'highPriority', 'mediumPriority', 'lowPriority'].map((key) => (
              <div key={key} className="panel" style={{ textAlign: 'center' }}>
                <div className="panel-bd" style={{ padding: 16 }}>
                  <div className="mono" style={{ fontSize: 8, color: '#999', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                    {key.replace(/([A-Z])/g, ' $1')}
                  </div>
                  <div className="mono" style={{ fontSize: 24, fontWeight: 600, color: '#1a1a1a' }}>{sla[key] ?? '—'}%</div>
                </div>
              </div>
            ))}
          </div>

          {/* Trend */}
          <div className="panel">
            <div className="panel-hdr"><h3>30-Day Request Trend</h3></div>
            <div className="panel-bd">
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={trends}>
                  <defs>
                    <linearGradient id="trendGradMono" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#1a1a1a" stopOpacity={0.06} />
                      <stop offset="100%" stopColor="#1a1a1a" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" tick={{ fill: '#999', fontSize: 9 }} tickFormatter={v => v.slice(5)} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#999', fontSize: 9 }} axisLine={false} tickLine={false} width={30} />
                  <Tooltip contentStyle={{ background: '#fff', border: '1px solid #1a1a1a', borderRadius: 0, fontSize: 11 }} />
                  <Area type="monotone" dataKey="count" stroke="#1a1a1a" strokeWidth={1.5} fill="url(#trendGradMono)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {tab === 'categories' && (
        <div className="g2-1" style={{ gap: 16 }}>
          {categories?.sectorDistribution && (
            <div className="panel">
              <div className="panel-hdr"><h3>Sector Distribution</h3></div>
              <div className="panel-bd">
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={categories.sectorDistribution} layout="vertical">
                    <XAxis type="number" tick={{ fill: '#999', fontSize: 9 }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="sector" tick={{ fill: '#666', fontSize: 9 }} axisLine={false} tickLine={false} width={80} />
                    <Tooltip contentStyle={{ background: '#fff', border: '1px solid #1a1a1a', borderRadius: 0, fontSize: 11 }} />
                    <Bar dataKey="count" fill="#1a1a1a" radius={[0, 1, 1, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
          {categories?.categoryDistribution && (
            <div className="panel">
              <div className="panel-hdr"><h3>Category Distribution</h3></div>
              <div className="panel-bd">
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={categories.categoryDistribution} layout="vertical">
                    <XAxis type="number" tick={{ fill: '#999', fontSize: 9 }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="category" tick={{ fill: '#666', fontSize: 9 }} axisLine={false} tickLine={false} width={90} />
                    <Tooltip contentStyle={{ background: '#fff', border: '1px solid #1a1a1a', borderRadius: 0, fontSize: 11 }} />
                    <Bar dataKey="count" fill="#555" radius={[0, 1, 1, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'sla' && (
        <div className="g2-1" style={{ gap: 16 }}>
          <div className="panel" style={{ textAlign: 'center' }}>
            <div className="panel-bd" style={{ padding: 24 }}>
              <h3 className="mono" style={{ fontSize: 9, color: '#999', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>SLA Compliance Rate</h3>
              <div className="mono" style={{ fontSize: 36, fontWeight: 600, color: '#1a1a1a', marginBottom: 8 }}>{sla?.complianceRate ?? '—'}%</div>
              <div className="mono" style={{ fontSize: 9, color: '#999' }}>Overall compliance across all priority levels</div>
            </div>
          </div>
          {sla?.sectorBreakdown && (
            <div className="panel">
              <div className="panel-hdr"><h3>Sector Breakdown</h3></div>
              <div className="panel-bd">
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={sla.sectorBreakdown} layout="vertical">
                    <XAxis type="number" tick={{ fill: '#999', fontSize: 9 }} axisLine={false} tickLine={false} domain={[0, 100]} />
                    <YAxis type="category" dataKey="sector" tick={{ fill: '#666', fontSize: 9 }} axisLine={false} tickLine={false} width={80} />
                    <Tooltip contentStyle={{ background: '#fff', border: '1px solid #1a1a1a', borderRadius: 0, fontSize: 11 }} />
                    <Bar dataKey="compliance" fill="#1a1a1a" radius={[0, 1, 1, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'agents' && (
        <div className="panel">
          <div className="panel-hdr"><h3>Agent Utilization</h3></div>
          <div className="panel-bd">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {utilization.map((u: any) => (
                <div key={u.name} className="flex items-center" style={{ gap: 12, padding: '6px 0' }}>
                  <span style={{ fontSize: 11, width: 120 }} className="truncate">{u.name}</span>
                  <div style={{ flex: 1, height: 8, background: '#e5e5e3' }}>
                    <div style={{ width: `${u.utilization}%`, height: '100%', background: '#1a1a1a', transition: 'width 0.3s' }} />
                  </div>
                  <span className="mono" style={{ fontSize: 9, color: '#999', width: 32, textAlign: 'right' }}>{u.utilization}%</span>
                  <span className="mono" style={{ fontSize: 9, color: '#999', width: 48, textAlign: 'right' }}>{u.workload}/{u.capacity}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
