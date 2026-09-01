import React from 'react';

export interface TextButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'white' | 'gray' | 'iris' | 'amber';
  underline?: boolean;
}

export const TextButton: React.FC<TextButtonProps> = ({
  children,
  variant = 'gray',
  underline = false,
  className = '',
  disabled,
  ...props
}) => {
  const variantStyles = {
    white: 'text-white hover:text-white/80',
    gray: 'text-[#9a9a9a] hover:text-white',
    iris: 'text-[#8052ff] hover:text-[#a07cff]',
    amber: 'text-[#ffb829] hover:text-[#ffc95c]',
  };

  return (
    <button
      className={`inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider transition-colors duration-200 focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed ${
        underline ? 'underline underline-offset-4' : ''
      } ${variantStyles[variant]} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};
