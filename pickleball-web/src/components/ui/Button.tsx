'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: React.ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  // Emerald — primary CTA (Book, Join, Create)
  primary: 'bg-success text-white hover:bg-success-dark active:scale-[0.98] shadow-[0_1px_3px_rgba(46,204,113,0.25)]',
  // White with slate border — secondary actions
  secondary: 'bg-white text-text-secondary border border-primary/25 hover:bg-primary/5 hover:border-primary/40 hover:text-primary active:scale-[0.98]',
  // Transparent with slate border — outline style
  outline: 'bg-transparent border border-primary/40 text-primary hover:bg-primary/8',
  // Ghost — minimal, just text
  ghost: 'bg-transparent text-primary hover:bg-primary/8',
  // Danger — destructive actions only
  danger: 'bg-error text-white hover:bg-error/90 active:scale-[0.98] shadow-[0_1px_2px_rgba(0,0,0,0.1)]',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-3.5 py-1.5 text-sm rounded-lg',
  md: 'px-5 py-2.5 text-sm rounded-xl',
  lg: 'px-6 py-3.5 text-base rounded-xl',
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  children,
  disabled,
  className = '',
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 font-semibold transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : icon}
      {children}
    </button>
  );
}
