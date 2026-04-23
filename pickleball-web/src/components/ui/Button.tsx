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
  // Black — primary CTA (Book, Join, Create) — matches iOS black action buttons
  primary: 'bg-[#1C1C1E] text-white hover:bg-black active:scale-[0.98] shadow-[0_1px_4px_rgba(0,0,0,0.20)]',
  // White with border — secondary actions
  secondary: 'bg-white text-text-primary border border-border hover:bg-background active:scale-[0.98]',
  // Transparent with border — tertiary/outline style
  outline: 'bg-transparent border border-separator text-text-primary hover:bg-background',
  // Ghost — minimal text-only
  ghost: 'bg-transparent text-text-primary hover:bg-background',
  // Danger — destructive actions only
  danger: 'bg-error text-white hover:bg-[#E0342A] active:scale-[0.98] shadow-[0_1px_2px_rgba(0,0,0,0.12)]',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-3.5 py-1.5 text-sm rounded-xl',
  md: 'px-5 py-2.5 text-sm rounded-2xl',
  lg: 'px-6 py-3.5 text-base rounded-2xl',
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
