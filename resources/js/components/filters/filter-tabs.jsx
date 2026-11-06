import { cn } from 'cn';

/**
 * A small segmented control.
 *
 * options: [{ value: 'all', label: 'All' }, ...]
 * value:   the currently selected value
 * onChange: called with the clicked option's value
 */
export function FilterTabs({
    options = [],
    value,
    onChange,
    ariaLabel = 'Filter tabs',
    className,
}) {
    return (
        <div
            role="group"
            aria-label={ariaLabel}
            className={cn(
                'inline-flex h-8 max-w-full items-center gap-0.5 overflow-x-auto rounded-lg bg-muted/60 p-0.5 ring-1 ring-border',
                className,
            )}
        >
            {options.map((option) => {
                const isActive = option.value === value;

                return (
                    <button
                        key={option.value}
                        type="button"
                        onClick={() => onChange(option.value)}
                        aria-pressed={isActive}
                        className={cn(
                            'h-7 shrink-0 rounded-md px-2.5 text-xs font-medium whitespace-nowrap transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none',
                            isActive
                                ? 'bg-blue-600 text-white shadow-sm dark:bg-blue-600 dark:text-white'
                                : 'text-muted-foreground hover:text-foreground',
                        )}
                    >
                        {option.label}
                    </button>
                );
            })}
        </div>
    );
}

export default FilterTabs;
