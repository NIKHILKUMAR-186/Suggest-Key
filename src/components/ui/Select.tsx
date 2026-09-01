import React from 'react';
import { ChevronDown } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: SelectOption[];
  error?: string;
}

export const Select: React.FC<SelectProps> = ({
  label,
  options,
  error,
  className = '',
  ...props
}) => {
  return (
    <div className="space-y-1.5 w-full">
      {label && (
        <label className="block text-xs uppercase tracking-wider text-[#9a9a9a] font-medium">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          className={`w-full appearance-none px-4 py-3 bg-white/[0.04] border ${
            error ? 'border-rose-500/50 focus:border-rose-500' : 'border-white/10 focus:border-[#8052ff]'
          } rounded-2xl text-white text-sm focus:outline-none transition-colors duration-200 cursor-pointer pr-10 ${className}`}
          {...props}
        >
          {(options || []).map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-[#121212] text-white">
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown className="w-4 h-4 text-[#9a9a9a] absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
      </div>
      {error && <p className="text-xs text-rose-400">{error}</p>}
    </div>
  );
};
