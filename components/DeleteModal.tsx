'use client';
import { useState } from 'react';

interface DeleteModalProps {
  isOpen: boolean;
  recordName: string;
  onConfirm: () => void;
  onCancel: () => void;
  isPending?: boolean;
}

export default function DeleteModal({
  isOpen,
  recordName,
  onConfirm,
  onCancel,
  isPending = false,
}: DeleteModalProps) {
  const [confirmText, setConfirmText] = useState('');

  function handleCancel() {
    setConfirmText('');
    onCancel();
  }

  function handleConfirm() {
    if (confirmText !== 'DELETE') return;
    onConfirm();
    setConfirmText('');
  }

  if (!isOpen) return null;

  const canConfirm = confirmText === 'DELETE' && !isPending;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
      style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) handleCancel(); }}
    >
      <div
        className="w-full max-w-md rounded-xl p-6 animate-slide-up"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-modal)' }}
      >
        {/* Icon + title */}
        <div className="flex items-start gap-4 mb-5">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
            style={{ background: 'rgba(239,68,68,0.1)' }}
          >
            <svg className="w-5 h-5" fill="none" stroke="var(--danger)" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-base" style={{ color: 'var(--text-primary)' }}>
              Delete Record
            </h3>
            <p className="text-sm mt-1 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              You are about to delete <strong style={{ color: 'var(--text-primary)' }}>{recordName}</strong>.
              This moves the record to the audit archive — it is not permanently destroyed.
            </p>
          </div>
        </div>

        {/* Confirm input */}
        <div className="mb-5">
          <label className="field-label">Type DELETE to confirm</label>
          <input
            className={`input-base font-mono tracking-widest${confirmText === 'DELETE' ? '' : ''}`}
            style={{
              borderColor: confirmText === 'DELETE' ? 'var(--success)' : undefined,
              boxShadow: confirmText === 'DELETE' ? '0 0 0 3px rgba(16,185,129,0.15)' : undefined,
            }}
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleConfirm(); if (e.key === 'Escape') handleCancel(); }}
            placeholder="DELETE"
            autoFocus
            autoComplete="off"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button onClick={handleCancel} className="btn-ghost flex-1" disabled={isPending}>
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!canConfirm}
            className="flex-1 px-4 py-2 rounded-md text-sm font-semibold text-white transition-all"
            style={{
              background: canConfirm ? 'var(--danger)' : 'var(--text-muted)',
              cursor: canConfirm ? 'pointer' : 'not-allowed',
              opacity: canConfirm ? 1 : 0.6,
            }}
          >
            {isPending ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                Deleting…
              </span>
            ) : (
              'Delete Record'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
