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
      className={`bg-surface rounded-2xl shadow-sm border border-border/50 p-4 ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow text-left w-full' : ''} ${className}`}
    >
      {children}
    </Component>
  );
}
