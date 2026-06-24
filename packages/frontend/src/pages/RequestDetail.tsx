import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getRequest, analyzeRequest, updateRequestStatus, getComments, addComment } from '../api/client';
import { StatusBadge, PriorityChip, ConfidenceMeter, Timeline, PageHeader } from '../components/ui';
import { useAppStore } from '../store/appStore';
import type { Request } from '../types';

export default function RequestDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [request, setRequest] = useState<Request | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [commentText, setCommentText] = useState('');
  const [sendingComment, setSendingComment] = useState(false);

  useEffect(() => {
    if (!id) return;
    getRequest(id).then(d => { setRequest(d); setLoading(false); }).catch(() => setLoading(false));
    getComments(id).then(setComments).catch(() => {});
  }, [id]);

  const handleAnalyze = async () => {
    if (!id) return;
    setAnalyzing(true);
    try {
      await analyzeRequest(id);
      const updated = await getRequest(id);
      setRequest(updated);
    } catch (err) {
      console.error(err);
    }
    setAnalyzing(false);
  };

  const handleStatus = async (status: string) => {
    if (!id) return;
    await updateRequestStatus(id, status);
    setRequest(prev => prev ? { ...prev, status } : prev);
  };

  const handleAddComment = async () => {
    if (!id || !commentText.trim()) return;
    setSendingComment(true);
    try {
      const newComment = await addComment(id, commentText.trim());
      setComments(prev => [newComment, ...prev]);
      setCommentText('');
    } catch (err) {
      console.error(err);
    }
    setSendingComment(false);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {[...Array(5)].map((_, i) => <div key={i} className="shimmer" style={{ height: 48 }} />)}
      </div>
    );
  }

  if (!request) return <div className="mono" style={{ fontSize: 11, color: '#999' }}>Request not found.</div>;

  const events = request.events?.map(e => ({
    date: new Date(e.createdAt).toLocaleTimeString('en-US'),
    event: e.eventType,
    actor: e.actorId || undefined,
    note: e.note || undefined,
    type: (e.eventType.includes('resolved') ? 'resolved' : e.eventType.includes('escalated') ? 'escalated' : 'updated') as 'resolved' | 'escalated' | 'updated',
  })) || [];

  return (
    <div>
      <PageHeader
        title="Request Detail"
        subtitle={request.id}
        action={<button onClick={() => navigate('/requests')} className="btn btn-sm btn-ghost">&larr; Back</button>}
      />

      <div className="g2-1" style={{ gap: 24 }}>
        {/* Main */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Summary */}
          <div className="panel">
            <div className="panel-bd" style={{ padding: 20 }}>
              <div className="flex items-start justify-between" style={{ gap: 16 }}>
                <div style={{ flex: 1 }}>
                  <h2 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>{request.title}</h2>
                  <p className="mono" style={{ fontSize: 10, color: '#666', marginTop: 8, lineHeight: 1.6 }}>{request.description}</p>
                </div>
                <div className="flex items-center" style={{ gap: 8, flexShrink: 0 }}>
                  <StatusBadge status={request.status} />
                  <PriorityChip priority={request.priority} />
                </div>
              </div>
              <div className="flex items-center" style={{ gap: 24, marginTop: 16, paddingTop: 16, borderTop: '1px solid #e5e5e3' }}>
                {[
                  { label: 'Sector', value: request.sector },
                  { label: 'Category', value: request.category },
                  { label: 'Channel', value: request.channel },
                  { label: 'Sentiment', value: request.sentiment }
                ].map(d => (
                  <div key={d.label}>
                    <div className="mono" style={{ fontSize: 8, color: '#999', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{d.label}</div>
                    <div className="mono" style={{ fontSize: 10, color: '#1a1a1a', marginTop: 2 }}>{d.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* AI Analysis */}
          <div className="panel">
            <div className="panel-hdr">
              <h3>AI Analysis</h3>
              <button onClick={handleAnalyze} disabled={analyzing} className="btn btn-sm btn-ghost">
                {analyzing ? 'Analyzing...' : 'Run AI Analysis'}
              </button>
            </div>
            <div className="panel-bd">
              {request.aiConfidence ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div className="g3" style={{ gap: 8 }}>
                    {[
                      { label: 'Confidence', value: `${request.aiConfidence}%` },
                      { label: 'Est. Resolution', value: `${request.estimatedResolutionTime || '—'}m` },
                      { label: 'Urgency', value: request.priority },
                    ].map(m => (
                      <div key={m.label} style={{ border: '1px solid #e5e5e3', padding: '12px 8px', textAlign: 'center' }}>
                        <div className="mono" style={{ fontSize: 8, color: '#999', marginBottom: 4 }}>{m.label}</div>
                        <div className="mono" style={{ fontSize: 16, fontWeight: 600, color: '#1a1a1a' }}>{m.value}</div>
                      </div>
                    ))}
                  </div>
                  {request.aiExplanation && (
                    <div className="mono" style={{ fontSize: 9, color: '#666', padding: 12, border: '1px solid #e5e5e3', background: '#f8f8f6', lineHeight: 1.6 }}>{request.aiExplanation}</div>
                  )}
                  <ConfidenceMeter value={request.aiConfidence} label="AI Confidence" />
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: 24, fontSize: 10, color: '#999' }} className="mono">Click "Run AI Analysis" to classify this request.</div>
              )}
            </div>
          </div>

          {/* Status + Timeline */}
          <div className="g2-2" style={{ gap: 16 }}>
            <div className="panel">
              <div className="panel-hdr"><h3>Status Actions</h3></div>
              <div className="panel-bd" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {['analyzing', 'in_progress', 'resolved', 'escalated'].map(s => (
                  <button
                    key={s}
                    onClick={() => handleStatus(s)}
                    disabled={request.status === s}
                    className="btn btn-sm"
                    style={{
                      width: '100%', textAlign: 'left', justifyContent: 'flex-start',
                      border: request.status === s ? '1px solid #1a1a1a' : '1px solid #d0d0ce',
                      background: request.status === s ? '#1a1a1a' : '#fff',
                      color: request.status === s ? '#fff' : '#666',
                    }}
                  >
                    {s.replace(/_/g, ' ')}
                  </button>
                ))}
              </div>
            </div>
            <div className="panel">
              <div className="panel-hdr"><h3>Timeline</h3></div>
              <div className="panel-bd">
                {events.length > 0 ? <Timeline events={events} /> : <div style={{ textAlign: 'center', padding: 24, fontSize: 10, color: '#999' }} className="mono">No events recorded.</div>}
              </div>
            </div>
          </div>

          {/* Comments */}
          <div className="panel">
            <div className="panel-hdr"><h3>Comments ({comments.length})</h3></div>
            <div className="panel-bd">
              <div className="flex" style={{ gap: 8, marginBottom: 16 }}>
                <input
                  type="text"
                  value={commentText}
                  onChange={e => setCommentText(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddComment()}
                  className="input-default text-xs flex-1"
                  placeholder="Add a comment..."
                />
                <button onClick={handleAddComment} disabled={sendingComment || !commentText.trim()} className="btn btn-primary text-[10px]">
                  {sendingComment ? 'Sending...' : 'Send'}
                </button>
              </div>
              {comments.length === 0 ? (
                <div className="mono" style={{ textAlign: 'center', padding: 16, fontSize: 10, color: '#999' }}>No comments yet.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {comments.map(c => (
                    <div key={c.id} style={{ padding: '8px 12px', border: '1px solid #e5e5e3', borderRadius: 6 }}>
                      <div className="flex items-center justify-between" style={{ marginBottom: 4 }}>
                        <span className="mono" style={{ fontSize: 8, color: '#999', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{c.authorName}</span>
                        <span className="mono" style={{ fontSize: 8, color: '#999' }}>{new Date(c.createdAt).toLocaleString('en-US')}</span>
                      </div>
                      <div className="mono" style={{ fontSize: 10, color: '#1a1a1a', lineHeight: 1.5 }}>{c.content}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="panel">
            <div className="panel-hdr"><h3>Details</h3></div>
            <div className="panel-bd" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { label: 'Customer', value: request.customerName || '—' },
                { label: 'Company', value: request.customerCompany || '—' },
                { label: 'Agent', value: request.agentName || 'Unassigned' },
                { label: 'Created', value: new Date(request.createdAt).toLocaleString('en-US') },
              ].map(d => (
                <div key={d.label} className="flex items-center justify-between">
                  <span className="mono" style={{ fontSize: 9, color: '#999', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{d.label}</span>
                  <span className="mono" style={{ fontSize: 10, color: '#1a1a1a', textAlign: 'right' }}>{d.value}</span>
                </div>
              ))}
            </div>
          </div>
          {request.recommendation && (
            <div className="panel">
              <div className="panel-hdr"><h3>AI Recommendation</h3></div>
              <div className="panel-bd" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div className="mono" style={{ fontSize: 10, color: '#1a1a1a' }}>{request.recommendation.recommendedAgentName || 'Agent'}</div>
                <ConfidenceMeter value={request.recommendation.score || 0} label="Match Score" />
                {request.recommendation.explanation && <div className="mono" style={{ fontSize: 9, color: '#666' }}>{request.recommendation.explanation}</div>}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
