import React from 'react';

export interface AvatarProps {
  src?: string | null;
  name?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  name = 'User',
  size = 'md',
  className = '',
}) => {
  const sizeStyles = {
    sm: 'w-7 h-7 text-xs rounded-full',
    md: 'w-10 h-10 text-sm rounded-full',
    lg: 'w-14 h-14 text-base rounded-[18px]',
    xl: 'w-24 h-24 text-2xl rounded-[24px]',
  };

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={`${sizeStyles[size]} object-cover border border-white/10 ${className}`}
      />
    );
  }

  const initial = (name || 'U').charAt(0).toUpperCase();

  return (
    <div
      className={`${sizeStyles[size]} bg-white/10 border border-white/10 text-white flex items-center justify-center font-medium ${className}`}
    >
      {initial}
    </div>
  );
};
