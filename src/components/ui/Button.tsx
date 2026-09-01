import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-semibold uppercase tracking-wider rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#8052ff]/50 disabled:opacity-40 disabled:cursor-not-allowed';

  const sizeStyles = {
    sm: 'text-xs px-4 py-2 gap-1.5',
    md: 'text-xs px-6 py-3 gap-2',
    lg: 'text-sm px-8 py-4 gap-2.5',
  };

  const variantStyles = {
    primary: 'bg-[#8052ff] hover:bg-[#6c3df0] text-white shadow-md shadow-[#8052ff]/20 active:scale-[0.98]',
    secondary: 'bg-white/10 hover:bg-white/15 text-white border border-white/10 active:scale-[0.98]',
    ghost: 'bg-transparent hover:bg-white/5 text-[#9a9a9a] hover:text-white',
    danger: 'bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-600/20 active:scale-[0.98]',
  };

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};
