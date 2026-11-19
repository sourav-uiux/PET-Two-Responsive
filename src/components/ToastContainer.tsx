import React from 'react';
import { CheckCircle2, Info, X } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const ToastContainer: React.FC = () => {
  const { toasts, dismissToast } = useApp();

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed bottom-20 lg:bottom-4 right-3 sm:right-4 left-3 sm:left-auto z-50 flex flex-col gap-2 sm:max-w-sm pointer-events-none"
    >
      {toasts.map((toast) => {
        const toneClasses =
          toast.tone === 'rose'
            ? 'border-rose-200 bg-white text-slate-900'
            : toast.tone === 'amber'
            ? 'border-amber-200 bg-white text-slate-900'
            : 'border-teal-200 bg-white text-slate-900';
        const iconColor =
          toast.tone === 'rose'
            ? 'text-rose-600'
            : toast.tone === 'amber'
            ? 'text-amber-600'
            : 'text-teal-600';

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto border rounded-xl shadow-lg px-4 py-3 flex items-start gap-3 ${toneClasses}`}
          >
            {toast.tone === 'slate' ? (
              <Info className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" strokeWidth={2} />
            ) : (
              <CheckCircle2 className={`w-4 h-4 ${iconColor} mt-0.5 shrink-0`} strokeWidth={2} />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-900">{toast.title}</p>
              {toast.description && (
                <p className="text-xs text-slate-600 mt-0.5 leading-snug">{toast.description}</p>
              )}
            </div>
            <button
              type="button"
              onClick={() => dismissToast(toast.id)}
              className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
              aria-label="Dismiss notification"
            >
              <X className="w-3.5 h-3.5" strokeWidth={2} />
            </button>
          </div>
        );
      })}
    </div>
  );
};
