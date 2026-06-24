import { useState, useEffect } from 'react';
import { XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { getReports, getSLAReport, getPerformanceReport } from '../api/client';
import { PageHeader } from '../components/ui';
import type { Report } from '../types';

const TABS = [
  { id: 'saved', label: 'Saved Reports' },
  { id: 'sla', label: 'SLA Report' },
  { id: 'performance', label: 'Performance' },
];

export default function Reports() {
  const [tab, setTab] = useState('saved');
  const [reports, setReports] = useState<Report[]>([]);
  const [slaData, setSlaData] = useState<any>(null);
  const [perfData, setPerfData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadData = () => {
    setLoading(true);
    Promise.all([getReports(), getSLAReport(), getPerformanceReport()]).then(([r, s, p]) => {
      setReports(r || []);
      setSlaData(s);
      setPerfData(p);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, []);

  if (loading) {
    return <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {[...Array(3)].map((_, i) => <div key={i} className="shimmer" style={{ height: 120 }} />)}
    </div>;
  }

  return (
    <div>
      <PageHeader
        title="Reports"
        subtitle="SLA compliance, performance, and operational reports."
      />

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

      {tab === 'saved' && (
        <div className="g3" style={{ gap: 12 }}>
          {reports.length === 0 ? (
            <div className="mono" style={{ fontSize: 10, color: '#999', textAlign: 'center', padding: 48, gridColumn: '1 / -1' }}>No saved reports.</div>
          ) : (
            reports.map((r) => (
              <div key={r.id} className="panel">
                <div className="panel-bd" style={{ padding: 16 }}>
                  <h4 style={{ fontSize: 13, fontWeight: 600, margin: '0 0 4px 0' }}>{r.name}</h4>
                  <div className="mono" style={{ fontSize: 9, color: '#999', marginBottom: 8 }}>{r.type}</div>
                  {r.summary && <div className="mono" style={{ fontSize: 9, color: '#666', marginBottom: 8 }}>{r.summary}</div>}
                  <div className="mono" style={{ fontSize: 8, color: '#b0b0b0' }}>{new Date(r.createdAt).toLocaleDateString('en-US')}</div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'sla' && slaData && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="panel" style={{ textAlign: 'center' }}>
            <div className="panel-bd" style={{ padding: 24 }}>
              <h3 className="mono" style={{ fontSize: 9, color: '#999', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>SLA Compliance</h3>
              <div className="mono" style={{ fontSize: 36, fontWeight: 600, color: '#1a1a1a', marginBottom: 8 }}>{slaData.complianceRate || 0}%</div>
              <div className="mono" style={{ fontSize: 9, color: '#999' }}>Overall SLA compliance rate</div>
            </div>
          </div>
          {slaData.dailyData && (
            <div className="panel">
              <div className="panel-hdr"><h3>Daily Trend</h3></div>
              <div className="panel-bd">
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={slaData.dailyData}>
                    <XAxis dataKey="date" tick={{ fill: '#999', fontSize: 9 }} axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 100]} tick={{ fill: '#999', fontSize: 9 }} axisLine={false} tickLine={false} width={30} />
                    <Tooltip contentStyle={{ background: '#fff', border: '1px solid #1a1a1a', borderRadius: 0, fontSize: 11 }} />
                    <Line type="monotone" dataKey="compliance" stroke="#1a1a1a" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'performance' && perfData && (
        <div className="panel">
          <div className="panel-hdr"><h3>Agent Performance</h3></div>
          <div className="panel-bd">
            {perfData.agents ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {perfData.agents.map((a: any, i: number) => (
                  <div key={i} className="flex items-center" style={{ gap: 12, padding: '8px 0', borderBottom: '1px solid #e5e5e3' }}>
                    <span style={{ fontSize: 11, width: 120 }} className="truncate">{a.name}</span>
                    <div style={{ flex: 1 }}>
                      <div className="flex items-center justify-between" style={{ marginBottom: 2 }}>
                        <span className="mono" style={{ fontSize: 9, color: '#999' }}>Utilization</span>
                        <span className="mono" style={{ fontSize: 9, color: '#666' }}>{a.utilization}%</span>
                      </div>
                      <div style={{ height: 6, background: '#e5e5e3' }}>
                        <div style={{ width: `${a.utilization}%`, height: '100%', background: '#1a1a1a' }} />
                      </div>
                    </div>
                    <span className="mono" style={{ fontSize: 9, color: '#999', width: 48, textAlign: 'right' }}>{a.resolved || 0} solved</span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: 32, fontSize: 10, color: '#999' }} className="mono">No performance data.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
