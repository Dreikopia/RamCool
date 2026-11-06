import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FilterPopover } from '@/components/filters/filter-popover';
import { cn } from 'cn';

/**
 * The filter toolbar: filters button, removable chips, and "Clear all".
 *
 * fields:    configuration passed straight to FilterPopover
 * activeCount: number of active filter groups (not individual selections)
 * chips:     [{ key, label, onRemove }]
 * canClear:  show "Clear all" when any filter (including search/type) is set
 */
export function FilterBar({
    fields = [],
    activeCount = 0,
    chips = [],
    canClear = false,
    onClearAll,
    className,
}) {
    return (
        <div className={cn('flex flex-wrap items-center gap-2', className)}>
            <FilterPopover fields={fields} activeCount={activeCount} />

            {chips.map((chip) => (
                <span
                    key={chip.key}
                    className="inline-flex h-7 max-w-full items-center gap-1 rounded-md border border-border bg-background pr-1 pl-2 text-xs shadow-xs"
                >
                    <span className="truncate">{chip.label}</span>

                    <button
                        type="button"
                        onClick={chip.onRemove}
                        aria-label={`Remove ${chip.label} filter`}
                        className="flex size-5 shrink-0 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                    >
                        <X className="size-3" aria-hidden="true" />
                    </button>
                </span>
            ))}

            {canClear && (
                <Button
                    type="button"
                    variant="ghost"
                    size="xs"
                    onClick={onClearAll}
                    className="h-7 px-2 text-muted-foreground"
                >
                    Clear all
                </Button>
            )}
        </div>
    );
}

export default FilterBar;
