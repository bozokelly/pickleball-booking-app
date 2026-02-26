import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export function Card({ children, className = '', onClick }: CardProps) {
  const Component = onClick ? 'button' : 'div';
  return (
    <Component
      onClick={onClick}
      className={`bg-surface rounded-2xl shadow-[0_2px_8px_rgba(79,111,163,0.07),0_1px_3px_rgba(0,0,0,0.04)] border border-primary/8 p-4 ${onClick ? 'cursor-pointer hover:shadow-[0_6px_24px_rgba(79,111,163,0.12),0_2px_8px_rgba(0,0,0,0.06)] hover:-translate-y-px transition-all duration-150 text-left w-full' : ''} ${className}`}
    >
      {children}
    </Component>
  );
}
