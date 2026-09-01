import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  className = '',
  ...props
}) => {
  return (
    <div className="space-y-1.5 w-full">
      {label && (
        <label className="block text-xs uppercase tracking-wider text-[#9a9a9a]">
          {label}
        </label>
      )}
      <input
        className={`w-full px-4 py-3 bg-white/[0.04] border ${
          error ? 'border-rose-500/50 focus:border-rose-500' : 'border-white/10 focus:border-[#8052ff]'
        } rounded-2xl text-white placeholder:text-[#9a9a9a]/40 text-sm focus:outline-none transition-colors duration-200 ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-rose-400">{error}</p>}
    </div>
  );
};
