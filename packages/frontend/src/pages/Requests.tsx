import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getRequestsWithTotal } from '../api/client';
import { PageHeader, StatusBadge, Pagination } from '../components/ui';

const PAGE_SIZE = 50;

export default function Requests() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const navigate = useNavigate();

  const fetchPage = useCallback(async (pageNum: number, statusFilter: string, searchQuery: string) => {
    setLoading(true);
    try {
      const params: Record<string, string> = { limit: String(PAGE_SIZE), offset: String(pageNum * PAGE_SIZE) };
      if (statusFilter !== 'all') params.status = statusFilter;
      if (searchQuery) params.search = searchQuery;
      const { data, total } = await getRequestsWithTotal(params);
      setRequests(data);
      setTotal(total);
    } catch {
      setRequests([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchPage(0, filter, search);
  }, [filter, fetchPage]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const statusFilters = ['all', 'new', 'in_progress', 'resolved', 'escalated'];

  return (
    <div>
      <PageHeader
        title="Requests"
        subtitle={`${total.toLocaleString()} total service requests.`}
        action={<button onClick={() => navigate('/requests/new')} className="btn btn-primary">+ New Request</button>}
      />

      <div className="panel">
        {/* Filter bar */}
        <div className="panel-hdr" style={{ flexWrap: 'wrap', gap: 8 }}>
          <div className="flex items-center" style={{ gap: 8, flex: 1 }}>
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { setPage(0); fetchPage(0, filter, search); } }}
              style={{ padding: '6px 10px', border: '1px solid #d0d0ce', fontSize: 12, fontFamily: 'JetBrains Mono, monospace', width: 180, outline: 'none', background: '#fff' }}
            />
            <div className="flex items-center" style={{ gap: 2 }}>
              {statusFilters.map(f => (
                <button
                  key={f}
                  onClick={() => { setFilter(f); setPage(0); }}
                  className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-ghost'}`}
                >
                  {f === 'all' ? 'All' : f.replace(/_/g, ' ')}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div style={{ padding: 24 }}>
            {[...Array(6)].map((_, i) => <div key={i} className="shimmer" style={{ height: 28, marginBottom: 8 }} />)}
          </div>
        ) : (
          <div className="tbl-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Title</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Customer</th>
                  <th>Agent</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {requests.map(r => (
                  <tr key={r.id} className="pointer" onClick={() => navigate(`/requests/${r.id}`)}>
                    <td className="mono" style={{ fontSize: 10, color: '#999', whiteSpace: 'nowrap' }}>{r.id}</td>
                    <td style={{ maxWidth: 220 }} className="truncate">{r.title}</td>
                    <td><span className="mono" style={{ fontSize: 10 }}>{r.priority}</span></td>
                    <td><StatusBadge status={r.status} /></td>
                    <td style={{ fontSize: 12, color: '#666' }}>{r.customerName || '—'}</td>
                    <td style={{ fontSize: 12, color: '#666' }}>{r.agentName || '—'}</td>
                    <td className="mono" style={{ fontSize: 9, color: '#999', whiteSpace: 'nowrap' }}>{r.createdAt?.slice(0, 10)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Pagination page={page} totalPages={totalPages} total={total} onPage={(p) => { setPage(p); fetchPage(p, filter, search); }} />
      </div>
    </div>
  );
}
