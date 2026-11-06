import { useEffect, useMemo, useState } from 'react';
import {
    endOfMonth,
    endOfWeek,
    format,
    isValid,
    parseISO,
    startOfMonth,
    startOfWeek,
} from 'date-fns';
import { CalendarDays, Check } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { cn } from 'cn';

const DATE_FORMAT = 'yyyy-MM-dd';
const WEEK_OPTIONS = { weekStartsOn: 1 };

const PRESETS = [
    { value: 'today', label: 'Today' },
    { value: 'this_week', label: 'This week' },
    { value: 'this_month', label: 'This month' },
];

const toDateValue = (date) => format(date, DATE_FORMAT);

const parseDate = (value) => {
    if (!value) {
        return undefined;
    }

    const date = parseISO(value);

    return isValid(date) ? date : undefined;
};

const getPresetRange = (preset, now = new Date()) => {
    switch (preset) {
        case 'today':
            return { from: now, to: now };
        case 'this_week':
            return {
                from: startOfWeek(now, WEEK_OPTIONS),
                to: endOfWeek(now, WEEK_OPTIONS),
            };
        case 'this_month':
            return {
                from: startOfMonth(now),
                to: endOfMonth(now),
            };
        default:
            return null;
    }
};

const findPreset = (from, to) => {
    if (!from || !to) {
        return null;
    }

    const now = new Date();

    return (
        PRESETS.find((preset) => {
            const range = getPresetRange(preset.value, now);

            return (
                toDateValue(range.from) === from && toDateValue(range.to) === to
            );
        }) ?? null
    );
};

/**
 * A short label for a date filter, used by removable chips.
 * Returns null when no date filter is active.
 */
export function getDateRangeLabel(from, to) {
    const preset = findPreset(from, to);

    if (preset) {
        return preset.label;
    }

    const fromDate = parseDate(from);
    const toDate = parseDate(to);

    if (fromDate && toDate) {
        return `${format(fromDate, 'MMM d, yyyy')} – ${format(toDate, 'MMM d, yyyy')}`;
    }

    if (fromDate) {
        return `From ${format(fromDate, 'MMM d, yyyy')}`;
    }

    if (toDate) {
        return `Until ${format(toDate, 'MMM d, yyyy')}`;
    }

    return null;
}

/**
 * Date filter with quick presets and a custom range calendar.
 *
 * value:    { from: 'yyyy-MM-dd', to: 'yyyy-MM-dd' }
 * onChange: called with a new { from, to } object
 */
export function DateRangeFilter({ value = {}, onChange, className }) {
    const from = value.from ?? '';
    const to = value.to ?? '';

    const [mode, setMode] = useState(() => (findPreset(from, to) ? 'preset' : 'custom'));

    // If a chip removes the date filter, show the calendar again so the user
    // has a way to choose a new range.
    useEffect(() => {
        if (!from && !to) {
            setMode('custom');
        }
    }, [from, to]);

    const selectedRange = useMemo(
        () => ({ from: parseDate(from), to: parseDate(to) }),
        [from, to],
    );

    const activePreset = findPreset(from, to);

    const choosePreset = (preset) => {
        const range = getPresetRange(preset);

        setMode('preset');
        onChange({ from: toDateValue(range.from), to: toDateValue(range.to) });
    };

    const handleRangeSelect = (range) => {
        onChange({
            from: range?.from ? toDateValue(range.from) : '',
            to: range?.to ? toDateValue(range.to) : '',
        });
    };

    const clearDates = () => {
        onChange({ from: '', to: '' });
    };

    const label = getDateRangeLabel(from, to);

    return (
        <div className={cn('flex flex-col gap-0.5', className)}>
            {PRESETS.map((preset) => {
                const isActive = mode === 'preset' && activePreset?.value === preset.value;

                return (
                    <button
                        key={preset.value}
                        type="button"
                        onClick={() => choosePreset(preset.value)}
                        className={cn(
                            'flex items-center justify-between rounded-md px-2 py-1.5 text-left text-sm transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none',
                            isActive
                                ? 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400'
                                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                        )}
                    >
                        <span>{preset.label}</span>
                        {isActive && <Check className="size-3.5" aria-hidden="true" />}
                    </button>
                );
            })}

            <button
                type="button"
                onClick={() => setMode('custom')}
                className={cn(
                    'flex items-center justify-between rounded-md px-2 py-1.5 text-left text-sm transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none',
                    mode === 'custom'
                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )}
            >
                <span className="flex items-center gap-1.5">
                    <CalendarDays className="size-3.5" aria-hidden="true" />
                    Custom range
                </span>
                {mode === 'custom' && <Check className="size-3.5" aria-hidden="true" />}
            </button>

            {mode === 'custom' && (
                <div className="mt-2 space-y-2 border-t border-border pt-2">
                    <p className="px-1 text-xs text-muted-foreground">
                        {label ?? 'Pick a start and end date.'}
                    </p>

                    <Calendar
                        mode="range"
                        selected={selectedRange}
                        onSelect={handleRangeSelect}
                        numberOfMonths={1}
                        weekStartsOn={1}
                    />

                    {(from || to) && (
                        <button
                            type="button"
                            onClick={clearDates}
                            className="px-1 text-xs font-medium text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                        >
                            Clear dates
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}

export default DateRangeFilter;
