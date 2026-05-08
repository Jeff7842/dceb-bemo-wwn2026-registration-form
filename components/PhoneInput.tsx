'use client';
import { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Icon } from '@iconify/react';

interface PhoneValue {
  countryCode: string;
  number: string;
}

interface Props {
  value: PhoneValue;
  onChange: (val: PhoneValue) => void;
  error?: string;
}

interface CountryOption {
  name: string;
  code: string;
  flag: string;
}

async function fetchCountries(): Promise<CountryOption[]> {
  const res = await fetch('https://restcountries.com/v3.1/all?fields=name,idd,flag');
  const data = await res.json();
  const list: CountryOption[] = [];
  for (const c of data) {
    const root = c.idd?.root ?? '';
    const suffix = c.idd?.suffixes?.[0] ?? '';
    const code = root + (c.idd?.suffixes?.length === 1 ? suffix : '');
    if (!code || code === '+') continue;
    list.push({
      name: c.name?.common ?? '',
      code,
      flag: c.flag ?? '',
    });
  }
  list.sort((a, b) => a.name.localeCompare(b.name));
  const ke = list.findIndex((c) => c.name === 'Kenya');
  if (ke > -1) {
    const [kenya] = list.splice(ke, 1);
    list.unshift(kenya);
  }
  return list;
}

export default function PhoneInput({ value, onChange, error }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const { data: countries = [] } = useQuery({
    queryKey: ['countries'],
    queryFn: fetchCountries,
    staleTime: Infinity,
  });

  const selected = countries.find((c) => c.code === value.countryCode) ?? {
    code: '+254',
    flag: '🇰🇪',
    name: 'Kenya',
  };

  const filtered = countries.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.code.includes(search)
  );

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearch('');
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      {/* Unified input: code trigger on the left, number on the right */}
      <div
        className={`input-base flex items-center p-0 overflow-visible${error ? ' input-error' : ''}`}
        style={{ padding: 0 }}
      >
        <button
          type="button"
          onClick={() => setIsOpen((o) => !o)}
          className="flex items-center gap-1 px-3 py-2.5 shrink-0 h-full transition-colors rounded-l-md"
          style={{
            borderRight: '1px solid var(--border)',
            background: 'var(--bg-secondary)',
            color: 'var(--text-primary)',
            minWidth: '5rem',
          }}
        >
          <span className="text-base leading-none">{selected.flag}</span>
          <span className="text-sm font-medium">{selected.code}</span>
          <Icon
            icon="lucide:chevron-down"
            className="w-3.5 h-3.5 transition-transform duration-200"
            style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', color: 'var(--text-muted)' }}
          />
        </button>
        <input
          type="tel"
          value={value.number}
          onChange={(e) => onChange({ ...value, number: e.target.value })}
          placeholder="700 000 000"
          className="flex-1 bg-transparent outline-none text-sm px-3 py-2.5"
          style={{ color: 'var(--text-primary)', minWidth: 0 }}
        />
      </div>

      {isOpen && (
        <div
          className="dropdown-panel absolute z-200 top-full left-0 mt-1 overflow-hidden"
          style={{ width: '18rem' }}
        >
          <div className="p-2" style={{ borderBottom: '1px solid var(--border)' }}>
            <div className="relative">
              <Icon
                icon="lucide:search"
                className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5"
                style={{ color: 'var(--text-muted)' }}
              />
              <input
                autoFocus
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search country…"
                className="input-base text-sm py-1.5 pl-8 indent-4"
              />
            </div>
          </div>
          <ul className="max-h-52 overflow-y-auto">
            {filtered.map((c) => (
              <li key={c.code + c.name}>
                <button
                  type="button"
                  onClick={() => {
                    onChange({ ...value, countryCode: c.code });
                    setIsOpen(false);
                    setSearch('');
                  }}
                  className={`dropdown-item flex items-center gap-2${value.countryCode === c.code ? ' selected' : ''}`}
                >
                  <span>{c.flag}</span>
                  <span className="flex-1 truncate">{c.name}</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{c.code}</span>
                </button>
              </li>
            ))}
            {filtered.length === 0 && (
              <li className="px-4 py-3 text-sm" style={{ color: 'var(--text-muted)' }}>No results</li>
            )}
          </ul>
        </div>
      )}

      {error && <p className="mt-1 text-xs" style={{ color: 'var(--danger)' }}>{error}</p>}
    </div>
  );
}
