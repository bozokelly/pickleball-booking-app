import React from 'react';

type BadgeVariant = 'soft' | 'solid';

interface BadgeProps {
  label: string;
  color?: string;
  variant?: BadgeVariant;
  className?: string;
}

export function Badge({ label, color = '#86868B', variant = 'soft', className = '' }: BadgeProps) {
  const style =
    variant === 'solid'
      ? { backgroundColor: color, color: '#fff' }
      : { backgroundColor: `${color}20`, color };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${className}`}
      style={style}
    >
      {label}
    </span>
  );
}
