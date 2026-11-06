import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { CheckCircle2, CircleAlert, X } from 'lucide-react';
import { cn } from 'cn';

const TOAST_DURATION = 5000;

const ToastContext = createContext(null);

let nextToastId = 0;

/**
 * Fixed-position viewport rendering the current toasts. Purely presentational
 * so it can live inside the provider without extra context plumbing.
 */
const ToastViewport = ({ toasts, onDismiss }) => (
    <div
        className="pointer-events-none fixed inset-x-0 bottom-0 z-[100] flex flex-col items-center gap-2 p-4 sm:items-end"
        role="status"
        aria-live="polite"
        aria-atomic="false"
    >
        {toasts.map((toast) => (
            <div
                key={toast.id}
                className={cn(
                    'pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl bg-popover p-3 text-sm text-popover-foreground shadow-lg ring-1 ring-foreground/10 data-open:animate-in data-open:fade-in-0 data-open:slide-in-from-bottom-2',
                    toast.variant === 'error' && 'border-destructive/40',
                )}
            >
                {toast.variant === 'error' ? (
                    <CircleAlert className="mt-0.5 size-4 shrink-0 text-destructive" />
                ) : (
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-green-600 dark:text-green-500" />
                )}

                <p className="min-w-0 flex-1 leading-snug break-words">{toast.message}</p>

                <button
                    type="button"
                    onClick={() => onDismiss(toast.id)}
                    className="rounded-md p-0.5 text-muted-foreground transition-colors hover:text-foreground"
                    aria-label="Dismiss notification"
                >
                    <X className="size-4" />
                </button>
            </div>
        ))}
    </div>
);

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);
    const timersRef = useRef(new Map());

    const dismiss = useCallback((id) => {
        setToasts((current) => current.filter((toast) => toast.id !== id));

        const timer = timersRef.current.get(id);

        if (timer) {
            clearTimeout(timer);
            timersRef.current.delete(id);
        }
    }, []);

    const push = useCallback((message, variant = 'success') => {
        const id = ++nextToastId;

        setToasts((current) => [...current, { id, message, variant }]);

        timersRef.current.set(
            id,
            setTimeout(() => {
                timersRef.current.delete(id);
                setToasts((current) => current.filter((toast) => toast.id !== id));
            }, TOAST_DURATION),
        );
    }, []);

    useEffect(() => {
        const timers = timersRef.current;

        return () => {
            timers.forEach((timer) => clearTimeout(timer));
            timers.clear();
        };
    }, []);

    return (
        <ToastContext.Provider value={{ push, dismiss }}>
            {children}
            <ToastViewport toasts={toasts} onDismiss={dismiss} />
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);

    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }

    return context;
}
