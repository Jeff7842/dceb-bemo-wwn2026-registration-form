'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const LINKS = [
  { href: '/', label: 'Register' },
  { href: '/search', label: 'Search' },
  { href: '/data', label: 'Admin' },
];

interface NavProps {
  rightExtra?: React.ReactNode;
}

export default function Nav({ rightExtra }: NavProps) {
  const pathname = usePathname();

  return (
    <nav className="fixed top-0 left-0 right-0 z-40 bg-[#071120]/85 backdrop-blur-md border-b border-white/10">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link
          href="/"
          className="font-playfair text-[#F5A623] font-bold text-base sm:text-lg tracking-wide hover:opacity-80 transition-opacity"
        >
          WWN 2026
        </Link>

        <div className="flex items-center gap-1 sm:gap-2">
          {LINKS.map((link) => {
            const isActive =
              link.href === '/'
                ? pathname === '/'
                : pathname === link.href || pathname.startsWith(link.href + '/');
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`relative px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors pb-2
                  ${isActive
                    ? 'text-[#F5A623]'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                  }`}
              >
                {link.label}
                {isActive && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4/5 h-0.5 bg-[#F5A623] rounded-full" />
                )}
              </Link>
            );
          })}
          {rightExtra && <div className="ml-2">{rightExtra}</div>}
        </div>
      </div>
    </nav>
  );
}
