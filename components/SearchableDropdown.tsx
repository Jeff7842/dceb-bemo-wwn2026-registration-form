'use client';
import { useState, useRef, useEffect } from 'react';
import { Icon } from '@iconify/react';

interface Props {
  options: string[];
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  allowOther?: boolean;
  onNewOption?: (val: string) => void;
  label?: string;
  error?: string;
}

export default function SearchableDropdown({
  options,
  value,
  onChange,
  placeholder = 'Select an option',
  allowOther = false,
  onNewOption,
  label,
  error,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [isOtherMode, setIsOtherMode] = useState(false);
  const [otherValue, setOtherValue] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered = options
    .filter((o) => o !== 'Other')
    .filter((o) => o.toLowerCase().includes(search.toLowerCase()));

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function handleSelect(option: string) {
    if (option === 'Other' && allowOther) {
      setIsOtherMode(true);
      setIsOpen(false);
      setOtherValue('');
      onChange('');
      return;
    }
    onChange(option);
    setIsOpen(false);
    setSearch('');
  }

  function handleOtherSave() {
    const trimmed = otherValue.trim();
    if (!trimmed) return;
    onChange(trimmed);
    onNewOption?.(trimmed);
    setIsOtherMode(false);
  }

  function handleOtherCancel() {
    setIsOtherMode(false);
    setOtherValue('');
    onChange('');
  }

  const displayValue = value || '';

  return (
    <div ref={containerRef} className="relative w-full">
      {label && <label className="field-label">{label}</label>}

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
            placeholder="Type option name…"
            className="input-base flex-1"
          />
          <button type="button" onClick={handleOtherCancel} className="btn-ghost px-3">
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
            color: displayValue ? 'var(--text-primary)' : 'var(--text-placeholder)',
          }}
        >
          <span className="truncate flex-1">{displayValue || placeholder}</span>
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
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search…"
                className="input-base text-sm py-1.5 pl-8 indent-4"
              />
            </div>
          </div>
          <ul className="max-h-48 overflow-y-auto">
            {filtered.map((opt) => (
              <li key={opt}>
                <button
                  type="button"
                  onClick={() => handleSelect(opt)}
                  className={`dropdown-item${value === opt ? ' selected' : ''}`}
                >
                  {opt}
                </button>
              </li>
            ))}
            {filtered.length === 0 && (
              <li className="px-4 py-3 text-sm" style={{ color: 'var(--text-muted)' }}>No matches found</li>
            )}
            {allowOther && (
              <li style={{ borderTop: '1px solid var(--border)' }}>
                <button
                  type="button"
                  onClick={() => handleSelect('Other')}
                  className="dropdown-item flex items-center gap-2"
                  style={{ color: 'var(--accent)' }}
                >
                  <Icon icon="lucide:plus-circle" className="w-4 h-4" />
                  Other (type your own)
                </button>
              </li>
            )}
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
