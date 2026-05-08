'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTheme } from '@/lib/theme-context';
import { useState, useEffect } from 'react';

const NAV_LINKS = [
  { href: '/', label: 'Register' },
  { href: '/search', label: 'Search & Directory' },
  { href: '/data', label: 'Dashboard' },
];

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [adminName, setAdminName] = useState<string | null>(null);

  useEffect(() => {
    const auth = localStorage.getItem('authenticated');
    const name = localStorage.getItem('adminName');
    setAdminName(auth === 'true' ? name : null);
  }, [pathname]);

  function handleLogout() {
    localStorage.removeItem('adminName');
    localStorage.removeItem('authenticated');
    setAdminName(null);
    setMobileOpen(false);
    router.push('/data/login');
  }

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(href + '/');

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50"
      style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
          <div
            className="w-7 h-7 rounded-md flex items-center justify-center font-bold text-white text-xs transition-opacity group-hover:opacity-80"
            style={{ background: 'var(--accent)' }}
          >
            W
          </div>
          <span
            className="font-display font-bold text-sm hidden sm:block tracking-tight transition-opacity group-hover:opacity-80"
            style={{ color: 'var(--text-primary)' }}
          >
            Worship &amp; Warfare Night
          </span>
          <span
            className="font-display font-bold text-sm sm:hidden tracking-tight"
            style={{ color: 'var(--text-primary)' }}
          >
            WWN
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-0.5">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="relative px-3 py-2 rounded-md text-sm font-medium transition-all"
              style={{
                color: isActive(link.href) ? 'var(--accent)' : 'var(--text-secondary)',
                background: isActive(link.href) ? 'rgba(56,189,248,0.08)' : 'transparent',
              }}
            >
              {link.label}
              {isActive(link.href) && (
                <span
                  className="absolute bottom-0.5 left-3 right-3 h-0.5 rounded-full"
                  style={{ background: 'var(--accent)' }}
                />
              )}
            </Link>
          ))}
        </nav>

        {/* Right controls */}
        <div className="flex items-center gap-2">
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="w-9 h-9 rounded-lg flex items-center justify-center transition-colors"
            style={{ color: 'var(--text-muted)', border: '1px solid var(--border)' }}
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
              </svg>
            )}
          </button>

          {/* Admin logout — desktop */}
          {adminName && (
            <button
              onClick={handleLogout}
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
              style={{ color: 'var(--danger)', border: '1px solid var(--danger)' }}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout
            </button>
          )}

          {/* Hamburger */}
          <button
            onClick={() => setMobileOpen((o) => !o)}
            className="md:hidden w-9 h-9 rounded-lg flex items-center justify-center transition-colors"
            style={{ color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
            aria-label="Toggle menu"
          >
            {mobileOpen ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div
          className="md:hidden animate-slide-down"
          style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)' }}
        >
          <nav className="flex flex-col py-2 px-4 gap-0.5">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="px-3 py-3 rounded-lg text-sm font-medium transition-colors"
                style={{
                  color: isActive(link.href) ? 'var(--accent)' : 'var(--text-secondary)',
                  background: isActive(link.href) ? 'rgba(56,189,248,0.08)' : 'transparent',
                }}
              >
                {link.label}
              </Link>
            ))}
            {adminName && (
              <button
                onClick={handleLogout}
                className="mt-1 px-3 py-3 rounded-lg text-sm font-medium text-left"
                style={{ color: 'var(--danger)' }}
              >
                Logout ({adminName})
              </button>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
