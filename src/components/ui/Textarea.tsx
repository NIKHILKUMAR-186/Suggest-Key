import React from 'react';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Textarea: React.FC<TextareaProps> = ({
  label,
  error,
  helperText,
  className = '',
  rows = 4,
  ...props
}) => {
  return (
    <div className="space-y-1.5 w-full">
      {label && (
        <label className="block text-xs uppercase tracking-wider text-[#9a9a9a] font-medium">
          {label}
        </label>
      )}
      <textarea
        rows={rows}
        className={`w-full px-4 py-3 bg-white/[0.04] border ${
          error ? 'border-rose-500/50 focus:border-rose-500' : 'border-white/10 focus:border-[#8052ff]'
        } rounded-2xl text-white placeholder:text-[#9a9a9a]/40 text-sm focus:outline-none transition-colors duration-200 resize-none ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-rose-400">{error}</p>}
      {helperText && !error && <p className="text-xs text-[#9a9a9a]">{helperText}</p>}
    </div>
  );
};
