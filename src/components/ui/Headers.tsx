import React from 'react';

export interface SectionHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: 'left' | 'center';
  accentColor?: 'iris' | 'amber' | 'verdant' | 'gray';
  action?: React.ReactNode;
  className?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  eyebrow,
  title,
  description,
  align = 'left',
  accentColor = 'iris',
  action,
  className = '',
}) => {
  const accentStyles = {
    iris: 'text-[#8052ff]',
    amber: 'text-[#ffb829]',
    verdant: 'text-[#15846e]',
    gray: 'text-[#9a9a9a]',
  };

  const isCenter = align === 'center';

  return (
    <div className={`flex flex-col md:flex-row md:items-end justify-between gap-6 ${isCenter ? 'text-center items-center' : ''} ${className}`}>
      <div className={`space-y-3 ${isCenter ? 'max-w-2xl mx-auto flex flex-col items-center' : 'max-w-3xl'}`}>
        {eyebrow && (
          <span className={`text-xs uppercase tracking-widest font-semibold block ${accentStyles[accentColor]}`}>
            {eyebrow}
          </span>
        )}
        <h2 className="text-3xl sm:text-4xl lg:text-[42px] leading-tight font-normal text-white tracking-[-0.03em]">
          {title}
        </h2>
        {description && (
          <p className="text-base sm:text-lg text-[#9a9a9a] font-light leading-relaxed max-w-2xl">
            {description}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
};

export interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  backLink?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  eyebrow,
  title,
  description,
  backLink,
  action,
  className = '',
}) => {
  return (
    <div className={`space-y-4 pb-6 border-b border-white/5 ${className}`}>
      {backLink && <div>{backLink}</div>}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1.5">
          {eyebrow && (
            <span className="text-xs uppercase tracking-widest font-semibold text-[#8052ff]">
              {eyebrow}
            </span>
          )}
          <h1 className="text-2xl sm:text-3xl font-normal text-white tracking-[-0.02em]">
            {title}
          </h1>
          {description && (
            <p className="text-sm text-[#9a9a9a] max-w-2xl font-light">
              {description}
            </p>
          )}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </div>
  );
};
