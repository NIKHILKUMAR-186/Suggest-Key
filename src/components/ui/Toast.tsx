import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  title?: string;
  description?: string;
  message?: string;
}

export interface ToastOptions {
  title?: string;
  description?: string;
  type?: ToastType;
  variant?: 'default' | 'destructive' | 'success';
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
  toast: (options: ToastOptions | string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const toast = useCallback((options: ToastOptions | string) => {
    const id = Math.random().toString(36).substring(2, 9);
    if (typeof options === 'string') {
      setToasts((prev) => [...prev, { id, type: 'info', message: options }]);
    } else {
      let type: ToastType = options.type || 'info';
      if (options.variant === 'destructive') {
        type = 'error';
      } else if (options.variant === 'success') {
        type = 'success';
      }
      setToasts((prev) => [
        ...prev,
        {
          id,
          type,
          title: options.title,
          description: options.description,
          message: options.description || options.title || '',
        },
      ]);
    }

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast, toast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto p-4 rounded-2xl border text-sm flex items-start justify-between gap-3 shadow-2xl backdrop-blur-md transition-all animate-in slide-in-from-bottom-5 duration-300 ${
              toast.type === 'success'
                ? 'bg-[#15846e]/20 border-[#15846e]/40 text-[#ffffff]'
                : toast.type === 'error'
                ? 'bg-rose-500/20 border-rose-500/40 text-white'
                : 'bg-[#1e1a2f]/90 border-[#8052ff]/40 text-white'
            }`}
          >
            <div className="flex items-start gap-2.5 pt-0.5">
              {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-[#15846e] shrink-0 mt-0.5" />}
              {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />}
              {toast.type === 'info' && <Info className="w-4 h-4 text-[#8052ff] shrink-0 mt-0.5" />}
              <div className="flex flex-col">
                {toast.title && <span className="font-semibold text-xs text-white">{toast.title}</span>}
                {toast.description ? (
                  <span className="font-normal text-xs text-[#d1d1d1] mt-0.5">{toast.description}</span>
                ) : (
                  toast.message && <span className="font-normal text-xs text-[#d1d1d1]">{toast.message}</span>
                )}
              </div>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-white/60 hover:text-white transition-colors shrink-0 mt-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextValue => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
