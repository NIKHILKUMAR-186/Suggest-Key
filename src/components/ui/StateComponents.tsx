import React from 'react';
import { AlertCircle, HelpCircle, Loader2 } from 'lucide-react';
import { Button } from './Button';

export interface StateProps {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<StateProps> = ({
  title,
  description,
  actionLabel,
  onAction,
  icon,
  className = '',
}) => {
  return (
    <div className={`p-10 sm:p-16 rounded-[24px] border border-dashed border-white/10 bg-white/[0.01] text-center flex flex-col items-center justify-center space-y-4 max-w-lg mx-auto ${className}`}>
      <div className="w-12 h-12 rounded-full bg-white/5 text-[#9a9a9a] flex items-center justify-center">
        {icon || <HelpCircle className="w-6 h-6" />}
      </div>
      <div className="space-y-1">
        <h3 className="text-base font-medium text-white">{title}</h3>
        {description && <p className="text-xs text-[#9a9a9a] max-w-xs mx-auto leading-relaxed">{description}</p>}
      </div>
      {actionLabel && onAction && (
        <Button variant="secondary" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};

export const LoadingState: React.FC<{ message?: string; className?: string }> = ({
  message = 'Loading advisory details...',
  className = '',
}) => {
  return (
    <div className={`p-12 flex flex-col items-center justify-center space-y-3 text-center ${className}`}>
      <Loader2 className="w-6 h-6 text-[#8052ff] animate-spin" />
      <span className="text-xs uppercase tracking-wider text-[#9a9a9a]">{message}</span>
    </div>
  );
};

export const ErrorState: React.FC<StateProps> = ({
  title,
  description,
  actionLabel = 'Retry',
  onAction,
  className = '',
}) => {
  return (
    <div className={`p-8 sm:p-12 rounded-[24px] border border-rose-500/20 bg-rose-500/[0.03] text-center flex flex-col items-center justify-center space-y-4 max-w-md mx-auto ${className}`}>
      <div className="w-10 h-10 rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center">
        <AlertCircle className="w-5 h-5" />
      </div>
      <div className="space-y-1">
        <h3 className="text-base font-medium text-white">{title}</h3>
        {description && <p className="text-xs text-[#9a9a9a] max-w-xs mx-auto leading-relaxed">{description}</p>}
      </div>
      {onAction && (
        <Button variant="secondary" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
