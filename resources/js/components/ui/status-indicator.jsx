import { cn } from 'cn';

const TONES = {
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    danger: 'bg-red-500',
    info: 'bg-sky-500',
    muted: 'bg-muted-foreground/40',
};

export function StatusIndicator({ tone = 'muted', label, className }) {
    return (
        <span
            className={cn(
                'inline-flex items-center gap-2 whitespace-nowrap text-sm text-foreground',
                className,
            )}
        >
            <span
                className={cn('size-2 shrink-0 rounded-full', TONES[tone] ?? TONES.muted)}
                aria-hidden="true"
            />
            {label}
        </span>
    );
}

export default StatusIndicator;
