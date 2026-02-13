'use client';

import React from 'react';
import { Button } from './Button';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'primary';
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'primary',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40" onClick={onCancel} />
      <div className="relative bg-surface rounded-2xl shadow-lg p-6 max-w-sm w-full">
        <h3 className="text-lg font-semibold text-text-primary mb-2">{title}</h3>
        <p className="text-text-secondary mb-6">{message}</p>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={onCancel} className="flex-1">
            {cancelLabel}
          </Button>
          <Button variant={variant === 'danger' ? 'danger' : 'primary'} onClick={onConfirm} className="flex-1">
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
