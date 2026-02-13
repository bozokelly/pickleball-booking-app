import React from 'react';

interface BadgeProps {
  label: string;
  color?: string;
  className?: string;
}

export function Badge({ label, color = '#8E8E93', className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${className}`}
      style={{ backgroundColor: `${color}20`, color }}
    >
      {label}
    </span>
  );
}
