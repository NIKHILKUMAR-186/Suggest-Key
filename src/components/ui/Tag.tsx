import React from 'react';

export interface TagProps {
  label: string;
  onClick?: () => void;
  selected?: boolean;
  className?: string;
}

export const Tag: React.FC<TagProps> = ({
  label,
  onClick,
  selected = false,
  className = '',
}) => {
  const isClickable = typeof onClick === 'function';

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!isClickable}
      className={`inline-flex items-center text-xs px-3.5 py-1.5 rounded-full border transition-all duration-200 uppercase tracking-wider font-medium whitespace-nowrap ${
        selected
          ? 'bg-[#8052ff] border-[#8052ff] text-white shadow-sm shadow-[#8052ff]/20'
          : 'bg-white/[0.03] border-white/10 text-[#bdbdbd] hover:border-white/20 hover:text-white'
      } ${!isClickable ? 'cursor-default' : 'cursor-pointer active:scale-95'} ${className}`}
    >
      {label}
    </button>
  );
};
