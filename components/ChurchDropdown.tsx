'use client';
import { useState, useRef, useEffect } from 'react';
import { Icon } from '@iconify/react';

interface Props {
  value: string;
  onChange: (val: string) => void;
  churches: string[];
  onNewChurch?: (name: string) => void;
  error?: string;
}

export default function ChurchDropdown({ value, onChange, churches, onNewChurch, error }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isOtherMode, setIsOtherMode] = useState(false);
  const [otherValue, setOtherValue] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered = churches
    .filter((c) => c !== 'Other')
    .filter((c) => c.toLowerCase().includes(searchTerm.toLowerCase()));

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function handleSelect(church: string) {
    if (church === 'Other') {
      setIsOtherMode(true);
      setIsOpen(false);
      setOtherValue('');
      onChange('');
      return;
    }
    onChange(church);
    setIsOpen(false);
    setSearchTerm('');
  }

  async function handleOtherSave() {
    const trimmed = otherValue.trim();
    if (!trimmed) return;
    onChange(trimmed);
    setIsOtherMode(false);
    try {
      await fetch('/api/churches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmed }),
      });
      onNewChurch?.(trimmed);
    } catch {
    }
  }

  function handleOtherCancel() {
    setIsOtherMode(false);
    setOtherValue('');
    onChange('');
  }

  return (
    <div ref={containerRef} className="relative w-full">
      {isOtherMode ? (
        <div className="flex gap-2">
          <input
            autoFocus
            type="text"
            value={otherValue}
            onChange={(e) => setOtherValue(e.target.value)}
            onBlur={handleOtherSave}
            onKeyDown={(e) => {
              if (e.key === 'Enter') { e.preventDefault(); handleOtherSave(); }
              if (e.key === 'Escape') handleOtherCancel();
            }}
            placeholder="Type your church name…"
            className="input-base flex-1"
          />
          <button
            type="button"
            onClick={handleOtherCancel}
            className="btn-ghost px-3"
            style={{ borderRadius: '6px' }}
          >
            <Icon icon="lucide:x" className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen((o) => !o)}
          className="input-base flex items-center justify-between text-left"
          style={{
            borderColor: error ? 'var(--danger)' : undefined,
            color: value ? 'var(--text-primary)' : 'var(--text-placeholder)',
          }}
        >
          <span className="flex items-center gap-2 flex-1 min-w-0">
            <Icon icon="lucide:building-2" className="w-4 h-4 shrink-0" style={{ color: 'var(--text-muted)' }} />
            <span className="truncate">{value || 'Search for your church'}</span>
          </span>
          <Icon
            icon="lucide:chevron-down"
            className="w-4 h-4 shrink-0 transition-transform duration-200 ml-2"
            style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', color: 'var(--text-muted)' }}
          />
        </button>
      )}

      {isOpen && (
        <div className="dropdown-panel absolute z-200 mt-1 w-full overflow-hidden">
          <div className="p-2" style={{ borderBottom: '1px solid var(--border)' }}>
            <div className="relative">
              <Icon icon="lucide:search" className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
              <input
                autoFocus
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search church…"
                className="input-base text-sm py-1.5 pl-8 indent-4"
              />
            </div>
          </div>
          <ul className="max-h-52 overflow-y-auto">
            {filtered.map((church) => (
              <li key={church}>
                <button
                  type="button"
                  onClick={() => handleSelect(church)}
                  className={`dropdown-item${value === church ? ' selected' : ''}`}
                >
                  {church}
                </button>
              </li>
            ))}
            {filtered.length === 0 && (
              <li className="px-4 py-3 text-sm" style={{ color: 'var(--text-muted)' }}>No churches found</li>
            )}
            <li style={{ borderTop: '1px solid var(--border)' }}>
              <button
                type="button"
                onClick={() => handleSelect('Other')}
                className="dropdown-item flex items-center gap-2"
                style={{ color: 'var(--accent)' }}
              >
                <Icon icon="lucide:plus-circle" className="w-4 h-4" />
                My church isn&apos;t listed
              </button>
            </li>
          </ul>
        </div>
      )}

      {error && (
        <div className="mt-1 flex items-center gap-1 text-xs" style={{ color: 'var(--danger)' }}>
          <Icon icon="lucide:alert-circle" className="w-3.5 h-3.5 shrink-0" />
          {error}
        </div>
      )}
    </div>
  );
}
