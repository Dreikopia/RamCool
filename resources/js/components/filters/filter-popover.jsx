import { useState } from 'react';
import { Check, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from 'cn';

/**
 * Two-pane filter popover.
 *
 * fields: [
 *   { key: 'date', label: 'Date', active: true, content: <DateRangeFilter /> },
 *   ...
 * ]
 *
 * The left pane lists the filter groups. The right pane shows whichever group
 * is selected. A checkmark appears next to groups that currently have a value.
 */
export function FilterPopover({ fields = [], activeCount = 0, className }) {
    const [open, setOpen] = useState(false);
    const [activeKey, setActiveKey] = useState(fields[0]?.key);

    const activeField = fields.find((field) => field.key === activeKey) ?? fields[0];

    const handleOpenChange = (nextOpen) => {
        if (nextOpen) {
            // Open on the first active group so users immediately see what is
            // filtering their results.
            const firstActive = fields.find((field) => field.active);

            setActiveKey(firstActive?.key ?? fields[0]?.key);
        }

        setOpen(nextOpen);
    };

    return (
        <Popover open={open} onOpenChange={handleOpenChange}>
            <PopoverTrigger
                render={
                    <Button
                        variant="outline"
                        size="default"
                        className={cn(
                            'h-8 gap-1.5 px-2.5 text-xs bg-background shadow-xs',
                            className,
                        )}
                    />
                }
            >
                <SlidersHorizontal className="size-3.5" aria-hidden="true" />
                Filters

                {activeCount > 0 && (
                    <span
                        className="ml-0.5 inline-flex size-4 items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-semibold"
                        aria-label={`${activeCount} active filters`}
                    >
                        {activeCount}
                    </span>
                )}
            </PopoverTrigger>

            <PopoverContent
                align="start"
                sideOffset={8}
                collisionPadding={16}
                aria-label="Filters"
                className="w-[min(92vw,32rem)] p-0"
            >
                <div className="flex flex-col sm:flex-row">
                    <div className="flex shrink-0 gap-0.5 overflow-x-auto border-b border-border p-2 sm:w-36 sm:flex-col sm:overflow-visible sm:border-r sm:border-b-0">
                        {fields.map((field) => {
                            const isActive = field.key === activeKey;

                            return (
                                <button
                                    key={field.key}
                                    type="button"
                                    onClick={() => setActiveKey(field.key)}
                                    aria-current={isActive ? 'true' : undefined}
                                    className={cn(
                                        'flex h-8 shrink-0 items-center justify-between gap-2 rounded-md px-2 text-left text-sm whitespace-nowrap transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none sm:w-full',
                                        isActive
                                            ? 'bg-primary/10 text-primary-text'
                                            : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                                    )}
                                >
                                    <span className="truncate">{field.label}</span>

                                    {field.active && (
                                        <Check
                                            className="size-3.5 shrink-0 text-primary-text"
                                            aria-hidden="true"
                                        />
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    <div className="min-w-0 flex-1 p-3">
                        <div className="mb-2 flex h-8 items-center justify-between gap-2">
                            <h3 className="text-sm font-medium">{activeField?.label}</h3>

                            {activeField?.count > 0 && (
                                <span className="text-xs text-muted-foreground">
                                    {activeField.count} selected
                                </span>
                            )}
                        </div>

                        {activeField?.content}
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
}

export default FilterPopover;
