import React from 'react';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'iris' | 'amber' | 'verdant' | 'neutral' | 'rose';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'sm',
  className = '',
}) => {
  const baseStyles = 'inline-flex items-center gap-1 font-semibold uppercase tracking-wider rounded-full border';

  const sizeStyles = {
    sm: 'text-[10px] px-2.5 py-0.5',
    md: 'text-xs px-3 py-1',
  };

  const variantStyles = {
    iris: 'border-[#8052ff]/30 bg-[#8052ff]/10 text-[#8052ff]',
    amber: 'border-[#ffb829]/30 bg-[#ffb829]/10 text-[#ffb829]',
    verdant: 'border-[#15846e]/30 bg-[#15846e]/10 text-[#15846e]',
    neutral: 'border-white/10 bg-white/5 text-[#9a9a9a]',
    rose: 'border-rose-500/30 bg-rose-500/10 text-rose-400',
  };

  return (
    <span className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}>
      {children}
    </span>
  );
};
