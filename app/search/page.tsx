'use client';
import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Header from '@/components/Header';
import DeleteModal from '@/components/DeleteModal';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

interface Member {
  id: string;
  first_name: string;
  last_name: string;
  phone_country_code: string;
  phone_number: string;
  email?: string;
  country?: string;
  region?: string;
  church_name?: string;
  role: 'member' | 'pastor' | 'staff';
  serving_area?: string;
  created_at: string;
  updated_at?: string;
}

function RoleBadge({ role }: { role: string }) {
  const cls = role === 'pastor' ? 'badge-pastor' : role === 'staff' ? 'badge-staff' : 'badge-member';
  const label = role === 'pastor' ? 'Pastor' : role === 'staff' ? 'Staff' : 'Member';
  return <span className={`badge ${cls}`}>{label}</span>;
}

function avatarHue(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 37 + name.charCodeAt(i)) % 360;
  return h;
}

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

export default function SearchPage() {
  const queryClient = useQueryClient();
  const [query, setQuery] = useState('');
  const [regionFilter, setRegionFilter] = useState('');
  const [churchFilter, setChurchFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [firstLetter, setFirstLetter] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [adminName] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('authenticated') === 'true' ? localStorage.getItem('adminName') : null;
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<Partial<Member>>({});
  const [deleteTarget, setDeleteTarget] = useState<Member | null>(null);

  const { data, isLoading } = useQuery<{ members: Member[] }>({
    queryKey: ['members'],
    queryFn: () => fetch('/api/members').then((r) => r.json()),
  });

  const members = useMemo(() => data?.members ?? [], [data]);

  const { regions, churches } = useMemo(() => {
    const r = new Set<string>();
    const c = new Set<string>();
    for (const m of members) {
      if (m.region) r.add(m.region);
      if (m.church_name) c.add(m.church_name);
    }
    return { regions: [...r].sort(), churches: [...c].sort() };
  }, [members]);

  const hasFilter = !!(query || regionFilter || churchFilter || roleFilter || firstLetter);

  const displayed = useMemo(() => {
    const q = query.toLowerCase();
    return members.filter((m) => {
      if (q) {
        const hay = `${m.first_name} ${m.last_name} ${m.church_name ?? ''} ${m.region ?? ''} ${m.role}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (firstLetter && !m.first_name.toUpperCase().startsWith(firstLetter)) return false;
      if (regionFilter && m.region !== regionFilter) return false;
      if (churchFilter && m.church_name !== churchFilter) return false;
      if (roleFilter && m.role !== roleFilter) return false;
      return true;
    });
  }, [members, query, firstLetter, regionFilter, churchFilter, roleFilter]);

  function clearAll() {
    setQuery('');
    setFirstLetter('');
    setRegionFilter('');
    setChurchFilter('');
    setRoleFilter('');
  }

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Member> & { admin_name?: string } }) => {
      const res = await fetch(`/api/members/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Update failed');
      return res.json();
    },
    onSuccess: () => {
      toast.success('Member updated');
      setEditingId(null);
      setEditDraft({});
      queryClient.invalidateQueries({ queryKey: ['members'] });
    },
    onError: () => toast.error('Failed to update member'),
  });

  const deleteMutation = useMutation({
    mutationFn: async ({ id, admin_name }: { id: string; admin_name: string }) => {
      const res = await fetch(`/api/members/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ admin_name }),
      });
      if (!res.ok) throw new Error('Delete failed');
      return res.json();
    },
    onSuccess: () => {
      toast.success('Record moved to archive');
      setDeleteTarget(null);
      queryClient.invalidateQueries({ queryKey: ['members'] });
    },
    onError: () => toast.error('Failed to delete record'),
  });

  function startEdit(m: Member) { setEditingId(m.id); setEditDraft({ ...m }); }
  function cancelEdit() { setEditingId(null); setEditDraft({}); }
  function saveEdit() {
    if (!editingId) return;
    updateMutation.mutate({ id: editingId, data: { ...editDraft, admin_name: adminName ?? undefined } });
  }

  const isAdmin = !!adminName;

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <Header />

      <DeleteModal
        isOpen={!!deleteTarget}
        recordName={deleteTarget ? `${deleteTarget.first_name} ${deleteTarget.last_name}` : ''}
        onConfirm={() => deleteTarget && deleteMutation.mutate({ id: deleteTarget.id, admin_name: adminName ?? 'unknown' })}
        onCancel={() => setDeleteTarget(null)}
        isPending={deleteMutation.isPending}
      />

      <div className="pt-14">
        {/* Top search bar */}
        <div
          className="sticky top-14 z-30"
          style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-3">
            <div className="relative flex-1 max-w-lg">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                style={{ color: 'var(--text-muted)' }}
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search name, church, region…"
                className="input-base pl-9"
                style={{ padding: '0.5rem 0.75rem 0.5rem 2.25rem', height: '2.25rem' }}
              />
            </div>
            <button
              onClick={() => setSidebarOpen((o) => !o)}
              className="btn-ghost gap-1.5 md:hidden"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
              </svg>
              Filters
              {hasFilter && (
                <span className="w-2 h-2 rounded-full" style={{ background: 'var(--accent)' }} />
              )}
            </button>
            <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
              <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{displayed.length}</span> / {members.length}
            </span>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex flex-col md:flex-row gap-6">
          {/* Sidebar */}
          <aside
            className={`w-full md:w-56 shrink-0 space-y-5 ${sidebarOpen ? 'block' : 'hidden'} md:block md:sticky`}
            style={{ top: '7rem', alignSelf: 'flex-start', maxHeight: 'calc(100vh - 8rem)', overflowY: 'auto' }}
          >
            {/* First letter filter */}
            <div>
              <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>First Name</p>
              <div className="flex flex-wrap gap-1">
                {LETTERS.map((l) => (
                  <button
                    key={l}
                    type="button"
                    onClick={() => setFirstLetter(firstLetter === l ? '' : l)}
                    className="w-7 h-7 rounded text-xs font-semibold transition-colors"
                    style={firstLetter === l
                      ? { background: 'var(--accent)', color: 'var(--bg)' }
                      : { background: 'var(--surface-elevated)', color: 'var(--text-secondary)' }
                    }
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>

            {/* Role */}
            <div>
              <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>Role</p>
              <div className="flex flex-col gap-1">
                {['', 'member', 'pastor', 'staff'].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRoleFilter(r)}
                    className="text-left px-3 py-1.5 rounded text-xs font-medium transition-colors"
                    style={roleFilter === r
                      ? { background: 'rgba(56,189,248,0.1)', color: 'var(--accent)' }
                      : { color: 'var(--text-secondary)' }
                    }
                  >
                    {r === '' ? 'All roles' : r.charAt(0).toUpperCase() + r.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Region */}
            {regions.length > 0 && (
              <div>
                <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>Region</p>
                <select
                  value={regionFilter}
                  onChange={(e) => setRegionFilter(e.target.value)}
                  className="input-base text-xs"
                  style={{ padding: '0.375rem 0.625rem' }}
                >
                  <option value="">All Regions</option>
                  {regions.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            )}

            {/* Church */}
            {churches.length > 0 && (
              <div>
                <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>Church</p>
                <select
                  value={churchFilter}
                  onChange={(e) => setChurchFilter(e.target.value)}
                  className="input-base text-xs"
                  style={{ padding: '0.375rem 0.625rem' }}
                >
                  <option value="">All Churches</option>
                  {churches.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            )}

            {hasFilter && (
              <button onClick={clearAll} className="text-xs w-full text-left" style={{ color: 'var(--danger)' }}>
                ✕ Clear all filters
              </button>
            )}
          </aside>

          {/* Main content */}
          <div className="flex-1 min-w-0">
            <div className="card overflow-hidden">
              <div
                className="flex items-center justify-between px-5 py-4"
                style={{ borderBottom: '1px solid var(--border)' }}
              >
                <h2 className="font-semibold text-base" style={{ color: 'var(--text-primary)' }}>
                  Search &amp; Directory
                </h2>
                {isAdmin && (
                  <span className="text-xs px-2 py-0.5 rounded" style={{ background: 'rgba(56,189,248,0.1)', color: 'var(--accent)' }}>
                    Admin — edit &amp; delete enabled
                  </span>
                )}
              </div>

              <div>
                {isLoading ? (
                  <div className="p-6 space-y-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="flex items-center gap-3 animate-pulse">
                        <div className="w-9 h-9 rounded-full shrink-0" style={{ background: 'var(--border)' }} />
                        <div className="flex-1 flex gap-3">
                          <div className="h-4 rounded w-28" style={{ background: 'var(--border)' }} />
                          <div className="h-4 rounded w-16" style={{ background: 'var(--border)' }} />
                          <div className="h-4 rounded flex-1" style={{ background: 'var(--border)' }} />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : displayed.length === 0 ? (
                  <div className="py-20 text-center" style={{ color: 'var(--text-muted)' }}>
                    <svg className="w-10 h-10 mx-auto mb-3 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <p className="text-sm font-medium">{hasFilter ? 'No members match your search' : 'Type to search or use filters'}</p>
                    {hasFilter && (
                      <button onClick={clearAll} className="mt-2 text-xs" style={{ color: 'var(--accent)' }}>Clear filters</button>
                    )}
                  </div>
                ) : (
                  <>
                    {/* ── Mobile transaction cards (hidden sm+) ── */}
                    <div className="sm:hidden" style={{ borderTop: '1px solid var(--border)' }}>
                      {displayed.map((m) => {
                        const hue = avatarHue(m.first_name + m.last_name);
                        const isEditing = editingId === m.id;
                        if (isEditing) {
                          return (
                            <div key={m.id} className="px-4 py-4 space-y-2.5" style={{ background: 'rgba(56,189,248,0.04)', borderBottom: '1px solid var(--border)' }}>
                              <div className="grid grid-cols-2 gap-2">
                                <input
                                  className="input-base text-xs"
                                  style={{ padding: '0.375rem 0.625rem' }}
                                  value={editDraft.first_name ?? ''}
                                  onChange={(e) => setEditDraft((d) => ({ ...d, first_name: e.target.value }))}
                                  placeholder="First name"
                                />
                                <input
                                  className="input-base text-xs"
                                  style={{ padding: '0.375rem 0.625rem' }}
                                  value={editDraft.last_name ?? ''}
                                  onChange={(e) => setEditDraft((d) => ({ ...d, last_name: e.target.value }))}
                                  placeholder="Last name"
                                />
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <select
                                  className="input-base text-xs"
                                  style={{ padding: '0.375rem 0.625rem' }}
                                  value={editDraft.role ?? m.role}
                                  onChange={(e) => setEditDraft((d) => ({ ...d, role: e.target.value as Member['role'] }))}
                                >
                                  <option value="member">Member</option>
                                  <option value="pastor">Pastor</option>
                                  <option value="staff">Staff</option>
                                </select>
                                <input
                                  className="input-base text-xs"
                                  style={{ padding: '0.375rem 0.625rem' }}
                                  value={editDraft.region ?? ''}
                                  onChange={(e) => setEditDraft((d) => ({ ...d, region: e.target.value }))}
                                  placeholder="Region"
                                />
                              </div>
                              <input
                                className="input-base text-xs"
                                style={{ padding: '0.375rem 0.625rem' }}
                                value={editDraft.church_name ?? ''}
                                onChange={(e) => setEditDraft((d) => ({ ...d, church_name: e.target.value }))}
                                placeholder="Church"
                              />
                              <div className="flex gap-2 pt-1">
                                <button
                                  onClick={saveEdit}
                                  disabled={updateMutation.isPending}
                                  className="flex-1 text-xs py-2 rounded font-semibold"
                                  style={{ background: 'var(--success)', color: 'white' }}
                                >
                                  {updateMutation.isPending ? 'Saving…' : 'Save changes'}
                                </button>
                                <button onClick={cancelEdit} className="flex-1 btn-ghost text-xs py-2">Cancel</button>
                              </div>
                            </div>
                          );
                        }
                        return (
                          <div
                            key={m.id}
                            className="flex items-center gap-3 px-4 py-3"
                            style={{ borderBottom: '1px solid var(--border-subtle)' }}
                          >
                            <div
                              className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                              style={{ background: `hsl(${hue},60%,50%)` }}
                            >
                              {m.first_name[0]}{m.last_name[0]}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-semibold text-sm truncate" style={{ color: 'var(--text-primary)' }}>
                                  {m.first_name} {m.last_name}
                                </span>
                                <RoleBadge role={m.role} />
                              </div>
                              <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>
                                {[m.church_name, m.region].filter(Boolean).join(' · ') || '—'}
                              </p>
                              <p className="text-xs font-mono mt-0.5" style={{ color: 'var(--text-muted)' }}>
                                {m.phone_country_code}{m.phone_number}
                              </p>
                            </div>
                            <div className="flex flex-col items-end gap-1.5 shrink-0">
                              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                {formatDistanceToNow(new Date(m.created_at), { addSuffix: true })}
                              </span>
                              {isAdmin && (
                                <div className="flex gap-1.5">
                                  <button
                                    onClick={() => startEdit(m)}
                                    className="text-xs px-2 py-0.5 rounded border font-medium"
                                    style={{ color: 'var(--accent)', borderColor: 'var(--accent)' }}
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => setDeleteTarget(m)}
                                    className="text-xs px-2 py-0.5 rounded border font-medium"
                                    style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }}
                                  >
                                    Del
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* ── Desktop table (hidden on mobile) ── */}
                    <div className="hidden sm:block overflow-x-auto">
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Name</th>
                            <th>Role</th>
                            <th>Church</th>
                            <th>Region</th>
                            <th>Phone</th>
                            <th>Joined</th>
                            {isAdmin && <th>Actions</th>}
                          </tr>
                        </thead>
                        <tbody>
                          {displayed.map((m) => {
                            const hue = avatarHue(m.first_name + m.last_name);
                            const isEditing = editingId === m.id;
                            return (
                              <tr key={m.id} style={isEditing ? { background: 'rgba(56,189,248,0.04)' } : undefined}>
                                <td>
                                  <div className="flex items-center gap-2.5">
                                    <div
                                      className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                                      style={{ background: `hsl(${hue},60%,50%)` }}
                                    >
                                      {m.first_name[0]}{m.last_name[0]}
                                    </div>
                                    {isEditing ? (
                                      <div className="flex gap-1">
                                        <input className="input-base text-xs" style={{ width: '6rem', padding: '0.25rem 0.5rem' }} value={editDraft.first_name ?? ''} onChange={(e) => setEditDraft((d) => ({ ...d, first_name: e.target.value }))} />
                                        <input className="input-base text-xs" style={{ width: '6rem', padding: '0.25rem 0.5rem' }} value={editDraft.last_name ?? ''} onChange={(e) => setEditDraft((d) => ({ ...d, last_name: e.target.value }))} />
                                      </div>
                                    ) : (
                                      <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{m.first_name} {m.last_name}</span>
                                    )}
                                  </div>
                                </td>
                                <td>
                                  {isEditing ? (
                                    <select className="input-base text-xs" style={{ padding: '0.25rem 0.5rem', width: '7rem' }} value={editDraft.role ?? m.role} onChange={(e) => setEditDraft((d) => ({ ...d, role: e.target.value as Member['role'] }))}>
                                      <option value="member">Member</option>
                                      <option value="pastor">Pastor</option>
                                      <option value="staff">Staff</option>
                                    </select>
                                  ) : <RoleBadge role={m.role} />}
                                </td>
                                <td>
                                  {isEditing ? (
                                    <input className="input-base text-xs" style={{ width: '9rem', padding: '0.25rem 0.5rem' }} value={editDraft.church_name ?? ''} onChange={(e) => setEditDraft((d) => ({ ...d, church_name: e.target.value }))} />
                                  ) : (
                                    <span className="text-sm truncate block max-w-36">{m.church_name ?? '—'}</span>
                                  )}
                                </td>
                                <td>
                                  {isEditing ? (
                                    <input className="input-base text-xs" style={{ width: '7rem', padding: '0.25rem 0.5rem' }} value={editDraft.region ?? ''} onChange={(e) => setEditDraft((d) => ({ ...d, region: e.target.value }))} />
                                  ) : (
                                    <span className="text-sm">{m.region ?? '—'}</span>
                                  )}
                                </td>
                                <td><span className="font-mono text-xs" style={{ color: 'var(--text-muted)' }}>{m.phone_country_code}{m.phone_number}</span></td>
                                <td><span className="text-xs whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>{formatDistanceToNow(new Date(m.created_at), { addSuffix: true })}</span></td>
                                {isAdmin && (
                                  <td>
                                    {isEditing ? (
                                      <div className="flex gap-1.5">
                                        <button onClick={saveEdit} disabled={updateMutation.isPending} className="text-xs px-2 py-1 rounded font-semibold" style={{ background: 'var(--success)', color: 'white' }}>Save</button>
                                        <button onClick={cancelEdit} className="btn-ghost text-xs py-1 px-2">Cancel</button>
                                      </div>
                                    ) : (
                                      <div className="flex gap-1.5">
                                        <button onClick={() => startEdit(m)} className="text-xs px-2 py-1 rounded border font-medium" style={{ color: 'var(--accent)', borderColor: 'var(--accent)' }}>Edit</button>
                                        <button onClick={() => setDeleteTarget(m)} className="text-xs px-2 py-1 rounded border font-medium" style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }}>Delete</button>
                                      </div>
                                    )}
                                  </td>
                                )}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
