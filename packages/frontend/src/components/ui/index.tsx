// YOYO — Minimal monochrome UI components

export function StatusBadge({ status, label }: { status: string; label?: string }) {
  const isActive = status === 'available' || status === 'resolved' || status === 'connected' || status === 'active' || status === 'new' || status === 'in_progress';
  const isWarning = status === 'waiting_customer' || status === 'analyzing' || status === 'escalated' || status === 'warning';
  const isDanger = status === 'critical' || status === 'danger' || status === 'error';
  const dotClass = isDanger ? 'red' : isWarning ? 'amber' : isActive ? 'green' : 'gray';
  const displayLabel = label || status.replace(/_/g, ' ');
  return (
    <span className="st-tag">
      <span className={`st-dot ${dotClass}`} />
      {displayLabel}
    </span>
  );
}

export function MetricCard({ label, value, subtitle }: { label: string; value: string | number; subtitle?: string }) {
  return (
    <div className="kpi-card">
      <div className="kpi-num">{value}</div>
      <div className="kpi-lbl">{label}</div>
      {subtitle && <div className="mono" style={{ fontSize: 9, color: '#b0b0b0', marginTop: 4 }}>{subtitle}</div>}
    </div>
  );
}

export function Pagination({ page, totalPages, total, onPage }: { page: number; totalPages: number; total: number; onPage: (p: number) => void }) {
  if (totalPages <= 1) return null;
  return (
    <div className="panel-ft" style={{ justifyContent: 'space-between' }}>
      <span className="mono" style={{ fontSize: 9, color: '#999' }}>{total.toLocaleString()} total</span>
      <div className="flex items-center" style={{ gap: 4 }}>
        <button className="btn btn-sm btn-ghost" disabled={page === 0} onClick={() => onPage(page - 1)}>←</button>
        <span className="mono" style={{ fontSize: 9, color: '#666', padding: '0 8px' }}>{page + 1} / {totalPages}</span>
        <button className="btn btn-sm btn-ghost" disabled={page >= totalPages - 1} onClick={() => onPage(page + 1)}>→</button>
      </div>
    </div>
  );
}

export function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="btn btn-sm btn-ghost" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}

export function PageHeader({ title, subtitle, label, action }: { title: string; subtitle?: string; label?: string; action?: React.ReactNode }) {
  return (
    <div className="page-head">
      {label && <div className="head-label">{label}</div>}
      <div className="flex items-start justify-between" style={{ gap: 24 }}>
        <div>
          <h1>{title}</h1>
          {subtitle && <div className="head-sub">{subtitle}</div>}
        </div>
        {action && <div style={{ flexShrink: 0 }}>{action}</div>}
      </div>
      <hr className="head-rule" />
    </div>
  );
}

export function PriorityChip({ priority, label }: { priority: string; label?: string }) {
  return (
    <span className="mono" style={{ fontSize: 9, padding: '2px 8px', border: '1px solid #d0d0ce', background: '#f8f8f6', color: priority === 'critical' ? '#c43a31' : priority === 'high' ? '#1a1a1a' : '#666', fontWeight: 600 }}>
      {label || priority}
    </span>
  );
}

export function Timeline({ events }: { events: { date: string; event: string; actor?: string; note?: string; type?: string }[] }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {events.map((ev, i) => (
        <div key={i} style={{ display: 'flex', gap: 12, padding: '8px 0', borderLeft: '1px solid #d0d0ce', marginLeft: 4, paddingLeft: 16, position: 'relative' }}>
          <div style={{ position: 'absolute', left: -3.5, top: 10, width: 7, height: 7, background: '#1a1a1a', display: 'inline-block' }} />
          <div style={{ flex: 1 }}>
            <div className="mono" style={{ fontSize: 9, color: '#1a1a1a', fontWeight: 600 }}>{ev.event}</div>
            <div className="mono" style={{ fontSize: 8, color: '#999', marginTop: 2 }}>
              {ev.date}{ev.actor ? ` · ${ev.actor}` : ''}
            </div>
            {ev.note && <div className="mono" style={{ fontSize: 8, color: '#666', marginTop: 2 }}>{ev.note}</div>}
          </div>
        </div>
      ))}
    </div>
  );
}

export function ConfidenceMeter({ value, size = 'sm', label }: { value: number; size?: 'sm' | 'md'; label?: string }) {
  const w = size === 'md' ? 80 : 48;
  const h = size === 'md' ? 6 : 4;
  const pct = Math.min(Math.max(value, 0), 100);
  return (
    <div style={{ width: label ? '100%' : w, display: 'flex', flexDirection: label ? 'column' : 'row', alignItems: label ? 'stretch' : 'center', gap: 4 }}>
      {label && <div className="mono" style={{ fontSize: 8, color: '#999', marginBottom: 2 }}>{label}</div>}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <div style={{ flex: 1, height: h, background: '#e5e5e3', position: 'relative' }}>
          <div style={{ width: `${pct}%`, height: '100%', background: '#1a1a1a', transition: 'width 0.3s' }} />
        </div>
        <span className="mono" style={{ fontSize: 8, color: '#999', width: 20, textAlign: 'right' }}>{pct}%</span>
      </div>
    </div>
  );
}

export function WorkloadRing({ value, size = 36 }: { value: number; size?: number }) {
  const pct = Math.min(Math.max(value, 0), 100);
  const r = (size - 4) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e5e5e3" strokeWidth={2.5} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#1a1a1a" strokeWidth={2.5} strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" />
    </svg>
  );
}
