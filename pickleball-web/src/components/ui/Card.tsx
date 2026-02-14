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
      className={`bg-surface rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.06)] border border-border/40 p-4 ${onClick ? 'cursor-pointer hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] transition-shadow text-left w-full' : ''} ${className}`}
    >
      {children}
    </Component>
  );
}
