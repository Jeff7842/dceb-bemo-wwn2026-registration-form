'use client';
import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import Header from '@/components/Header';
import Link from 'next/link';
import { format, formatDistanceToNow } from 'date-fns';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

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

function StatCard({ label, value, sub, icon }: { label: string; value: number | string; sub?: string; icon: React.ReactNode }) {
  return (
    <div className="stat-card flex items-start justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>{label}</p>
        <p className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>{value}</p>
        {sub && <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{sub}</p>}
      </div>
      <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'rgba(56,189,248,0.1)', color: 'var(--accent)' }}>
        {icon}
      </div>
    </div>
  );
}

export default function DataPage() {
  const router = useRouter();
  const [adminName] = useState<string>(() => {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem('adminName') ?? 'Admin';
  });

  useEffect(() => {
    if (localStorage.getItem('authenticated') !== 'true') {
      router.replace('/data/login');
    }
  }, [router]);

  const { data, isLoading } = useQuery<{ members: Member[] }>({
    queryKey: ['members'],
    queryFn: () => fetch('/api/members').then((r) => r.json()),
  });

  const members = useMemo(() => data?.members ?? [], [data]);

  const stats = useMemo(() => ({
    total: members.length,
    churches: new Set(members.map((m) => m.church_name).filter(Boolean)).size,
    servants: members.filter((m) => m.role === 'staff').length,
    pastors: members.filter((m) => m.role === 'pastor').length,
  }), [members]);

  const recent = useMemo(() => [...members].sort((a, b) =>
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  ).slice(0, 10), [members]);

  function downloadPDF() {
    const doc = new jsPDF({ orientation: 'landscape' });
    const W = doc.internal.pageSize.getWidth();

    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, W, 32, 'F');
    doc.setFontSize(18);
    doc.setTextColor(248, 250, 252);
    doc.setFont('helvetica', 'bold');
    doc.text('Worship & Warfare Night 2026', 14, 14);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184);
    doc.text('Registered Attendees Report', 14, 21);
    doc.text(`Generated: ${format(new Date(), 'PPpp')}  ·  Total: ${members.length} registered`, 14, 27);

    const statsRow = [
      `Total: ${stats.total}`,
      `Churches: ${stats.churches}`,
      `Servants: ${stats.servants}`,
      `Pastors: ${stats.pastors}`,
    ];
    doc.setFontSize(8);
    doc.setTextColor(56, 189, 248);
    statsRow.forEach((s, i) => doc.text(s, 14 + i * 65, 38));

    autoTable(doc, {
      startY: 44,
      head: [['#', 'Name', 'Phone', 'Email', 'Country', 'Region', 'Church', 'Role', 'Serving Area', 'Registered']],
      body: members.map((m, i) => [
        i + 1,
        `${m.first_name} ${m.last_name}`,
        `${m.phone_country_code}${m.phone_number}`,
        m.email ?? '',
        m.country ?? '',
        m.region ?? '',
        m.church_name ?? '',
        m.role.charAt(0).toUpperCase() + m.role.slice(1),
        m.serving_area ?? '',
        format(new Date(m.created_at), 'dd/MM/yy HH:mm'),
      ]),
      styles: { fontSize: 7, cellPadding: 3 },
      headStyles: { fillColor: [56, 189, 248], textColor: [15, 23, 42], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      didDrawPage: () => {
        const pg = doc.getCurrentPageInfo().pageNumber;
        const total = doc.getNumberOfPages();
        doc.setFontSize(7);
        doc.setTextColor(148, 163, 184);
        doc.text(`Page ${pg} of ${total}  ·  Worship & Warfare Night 2026`, 14, doc.internal.pageSize.getHeight() - 8);
      },
    });
    doc.save('wwn-2026-report.pdf');
    toast.success('PDF exported successfully');
  }

  function downloadExcel() {
    const rows = members.map((m, i) => ({
      '#': i + 1,
      'First Name': m.first_name,
      'Last Name': m.last_name,
      'Phone': `${m.phone_country_code}${m.phone_number}`,
      'Email': m.email ?? '',
      'Country': m.country ?? '',
      'Region': m.region ?? '',
      'Church': m.church_name ?? '',
      'Role': m.role,
      'Serving Area': m.serving_area ?? '',
      'Registered': format(new Date(m.created_at), 'dd/MM/yyyy HH:mm'),
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    ws['!cols'] = [5, 14, 14, 18, 28, 14, 18, 28, 10, 20, 18].map((w) => ({ wch: w }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Attendees');
    XLSX.writeFile(wb, 'wwn-2026-attendees.xlsx');
    toast.success('Excel exported successfully');
  }

  if (!adminName) return null;

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <Header />

      <div className="pt-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          {/* Page header */}
          <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
            <div>
              <h1 className="font-display text-2xl sm:text-3xl font-semibold" style={{ color: 'var(--text-primary)' }}>
                Dashboard Overview
              </h1>
              <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                A high-level view of registration metrics and active personnel.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Link href="/search">
                <button className="btn-ghost">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <span className="hidden sm:inline">Directory Search</span>
                </button>
              </Link>
              <button onClick={downloadExcel} className="btn-ghost">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="hidden sm:inline">Export Excel</span>
              </button>
              <button
                onClick={downloadPDF}
                className="px-3 sm:px-4 py-2 rounded-md text-sm font-semibold flex items-center gap-2"
                style={{ background: 'var(--primary-btn)', color: 'var(--primary-btn-text)' }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                <span className="hidden sm:inline">Export Report</span>
              </button>
            </div>
          </div>

          {/* Stat cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            <StatCard
              label="Total Brethren"
              value={isLoading ? '—' : stats.total}
              sub="registered attendees"
              icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
            />
            <StatCard
              label="Churches Represented"
              value={isLoading ? '—' : stats.churches}
              sub="unique congregations"
              icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>}
            />
            <StatCard
              label="Active Servants"
              value={isLoading ? '—' : stats.servants}
              sub="serving the event"
              icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>}
            />
          </div>

          {/* Recent Registrations */}
          <div className="card overflow-hidden">
            <div
              className="flex items-center justify-between px-5 py-4"
              style={{ borderBottom: '1px solid var(--border)' }}
            >
              <h2 className="font-semibold text-base" style={{ color: 'var(--text-primary)' }}>
                Recent Registrations
              </h2>
              <Link
                href="/search"
                className="text-xs font-medium"
                style={{ color: 'var(--accent)' }}
              >
                View all →
              </Link>
            </div>

            <div>
              {isLoading ? (
                <div className="p-6 space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
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
              ) : (
                <>
                  {/* Mobile card list — hidden on sm+ */}
                  <div className="sm:hidden" style={{ borderTop: '1px solid var(--border)' }}>
                    {recent.length === 0 ? (
                      <p className="py-10 text-center text-sm" style={{ color: 'var(--text-muted)' }}>No registrations yet</p>
                    ) : recent.map((m) => (
                      <div
                        key={m.id}
                        className="flex items-center gap-3 px-4 py-3"
                        style={{ borderBottom: '1px solid var(--border-subtle)' }}
                      >
                        <div
                          className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                          style={{ background: `hsl(${avatarHue(m.first_name + m.last_name)},60%,50%)` }}
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
                        </div>
                        <span className="text-xs shrink-0 ml-1" style={{ color: 'var(--text-muted)' }}>
                          {formatDistanceToNow(new Date(m.created_at), { addSuffix: true })}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Desktop table — hidden on mobile */}
                  <div className="hidden sm:block overflow-x-auto">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Role</th>
                          <th>Church</th>
                          <th>Region</th>
                          <th>Registered</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recent.map((m) => (
                          <tr key={m.id}>
                            <td>
                              <div className="flex items-center gap-2.5">
                                <div
                                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                                  style={{ background: `hsl(${avatarHue(m.first_name + m.last_name)},60%,50%)` }}
                                >
                                  {m.first_name[0]}{m.last_name[0]}
                                </div>
                                <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                                  {m.first_name} {m.last_name}
                                </span>
                              </div>
                            </td>
                            <td><RoleBadge role={m.role} /></td>
                            <td><span className="text-sm truncate block max-w-40">{m.church_name ?? '—'}</span></td>
                            <td><span className="text-sm">{m.region ?? '—'}</span></td>
                            <td>
                              <span className="text-xs whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>
                                {formatDistanceToNow(new Date(m.created_at), { addSuffix: true })}
                              </span>
                            </td>
                          </tr>
                        ))}
                        {recent.length === 0 && (
                          <tr>
                            <td colSpan={5} className="text-center py-10" style={{ color: 'var(--text-muted)' }}>No registrations yet</td>
                          </tr>
                        )}
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
  );
}
