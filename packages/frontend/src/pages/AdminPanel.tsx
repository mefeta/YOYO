import { useState, useEffect } from 'react';
import { PageHeader } from '../components/ui';
import { getUsers, createUser } from '../api/client';

export default function AdminPanel() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'agent' });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [lastCreated, setLastCreated] = useState<any>(null);

  useEffect(() => {
    getUsers()
      .then(setUsers)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleCreate = async () => {
    setError('');
    setSuccess('');
    if (!form.name || !form.email || !form.password) {
      setError('All fields are required');
      return;
    }
    setCreating(true);
    try {
      const newUser = await createUser(form);
      setUsers(prev => [...prev, newUser]);
      setShowForm(false);
      setLastCreated(newUser);
      setForm({ name: '', email: '', password: '', role: 'agent' });
    } catch (err: any) {
      setError(err.message || 'Failed to create user');
    }
    setCreating(false);
  };

  const dismissSuccess = () => setLastCreated(null);

  return (
    <div>
      <PageHeader
        title="Admin Panel"
        subtitle="Manage users and system settings"
        action={
          <button onClick={() => setShowForm(!showForm)} className="btn btn-primary text-[10px]">
            {showForm ? 'Cancel' : '+ New User'}
          </button>
        }
      />

      {lastCreated && (
        <div className="bg-success/10 border border-success/30 rounded-lg p-4 mb-4" style={{ border: '1px solid #62D26F' }}>
          <div className="flex items-center justify-between" style={{ marginBottom: 8 }}>
            <span className="text-xs font-semibold text-text-main">User Created Successfully</span>
            <button onClick={dismissSuccess} className="btn btn-sm btn-ghost text-[10px]">Dismiss</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div className="mono" style={{ fontSize: 11, color: '#1a1a1a' }}>Name: <strong>{lastCreated.name}</strong></div>
            <div className="mono" style={{ fontSize: 11, color: '#1a1a1a' }}>Email: <strong>{lastCreated.email}</strong></div>
            <div className="mono" style={{ fontSize: 11, color: '#1a1a1a' }}>Password: <strong style={{ color: '#c43a31', background: '#fff', padding: '2px 8px', border: '1px dashed #c43a31' }}>{lastCreated.password}</strong></div>
            <div className="mono" style={{ fontSize: 11, color: '#1a1a1a' }}>Role: <strong>{lastCreated.role}</strong></div>
          </div>
        </div>
      )}

      {/* New User Form */}
      {showForm && (
        <div className="bg-surface border border-border rounded-lg p-5 mb-5 space-y-4">
          <h2 className="text-sm font-semibold text-text-main">Create New User</h2>
          {error && <div className="text-xs text-error font-mono">{error}</div>}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-mono text-text-dim uppercase mb-1">Name</label>
              <input type="text" value={form.name} onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                className="input-default text-xs" placeholder="Full name" />
            </div>
            <div>
              <label className="block text-[10px] font-mono text-text-dim uppercase mb-1">Email</label>
              <input type="email" value={form.email} onChange={e => setForm(prev => ({ ...prev, email: e.target.value }))}
                className="input-default text-xs" placeholder="email@yoyo.ai" />
            </div>
            <div>
              <label className="block text-[10px] font-mono text-text-dim uppercase mb-1">Password</label>
              <input type="password" value={form.password} onChange={e => setForm(prev => ({ ...prev, password: e.target.value }))}
                className="input-default text-xs" placeholder="Default password" />
            </div>
            <div>
              <label className="block text-[10px] font-mono text-text-dim uppercase mb-1">Role</label>
              <select value={form.role} onChange={e => setForm(prev => ({ ...prev, role: e.target.value }))}
                className="input-default text-xs">
                <option value="admin">Admin</option>
                <option value="manager">Manager</option>
                <option value="agent">Agent</option>
                <option value="worker">Worker</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end">
            <button onClick={handleCreate} disabled={creating} className="btn btn-primary text-xs">
              {creating ? 'Creating...' : 'Create User'}
            </button>
          </div>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-surface border border-border rounded-lg">
        <div className="px-4 py-3 border-b border-border">
          <h3 className="text-xs font-semibold text-text-main">System Users</h3>
        </div>
        {loading ? (
          <div className="p-8 text-center text-xs text-text-dim font-mono">Loading...</div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center text-xs text-text-dim font-mono">No users found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="tbl">
              <thead>
                <tr>
                  <th className="text-[9px]">Name</th>
                  <th className="text-[9px]">Email</th>
                  <th className="text-[9px]">Role</th>
                  <th className="text-[9px]">Created</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td className="text-xs font-medium text-text-main">{u.name}</td>
                    <td className="text-[10px] text-text-dim font-mono">{u.email}</td>
                    <td>
                      <span className={`st-tag text-[9px] ${
                        u.role === 'admin' ? 'st-error' : u.role === 'manager' ? 'st-warn' : u.role === 'agent' ? 'st-info' : 'st-neutral'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="text-[10px] text-text-dim font-mono">
                      {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
