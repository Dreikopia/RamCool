import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { cn } from 'cn';

/**
 * A searchable, scrollable list of checkboxes.
 *
 * options:  [{ value, label, description }]
 * selected: array of currently selected values
 * onChange: called with the next array of selected values
 *
 * The component does not know what the options mean, so it can be reused for
 * products, users, suppliers, categories, and so on.
 */
export function CheckboxListFilter({
    options = [],
    selected = [],
    onChange,
    searchPlaceholder = 'Search…',
    emptyMessage = 'No options found.',
    listClassName,
    className,
}) {
    const [search, setSearch] = useState('');

    const visibleOptions = useMemo(() => {
        const needle = search.trim().toLowerCase();

        if (!needle) {
            return options;
        }

        return options.filter((option) => {
            const label = String(option.label ?? '').toLowerCase();
            const description = String(option.description ?? '').toLowerCase();

            return label.includes(needle) || description.includes(needle);
        });
    }, [options, search]);

    const isSelected = (value) =>
        selected.some((item) => String(item) === String(value));

    const toggle = (value) => {
        const next = isSelected(value)
            ? selected.filter((item) => String(item) !== String(value))
            : [...selected, value];

        onChange(next);
    };

    return (
        <div className={cn('flex flex-col gap-2', className)}>
            <div className="relative">
                <Search
                    className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground"
                    aria-hidden="true"
                />

                <Input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder={searchPlaceholder}
                    aria-label={searchPlaceholder}
                    className="h-8 bg-background pl-8 text-sm shadow-xs"
                />
            </div>

            <div className={cn('max-h-56 overflow-y-auto pr-0.5', listClassName)}>
                {visibleOptions.length === 0 ? (
                    <p className="px-1.5 py-6 text-center text-xs text-muted-foreground">
                        {emptyMessage}
                    </p>
                ) : (
                    <div className="space-y-0.5">
                        {visibleOptions.map((option) => {
                            const checked = isSelected(option.value);

                            return (
                                <label
                                    key={option.value}
                                    className={cn(
                                        'flex cursor-pointer items-start gap-2 rounded-md px-1.5 py-1.5 text-sm transition-colors hover:bg-muted/70',
                                        checked && 'bg-primary/10',
                                    )}
                                >
                                    <Checkbox
                                        checked={checked}
                                        onCheckedChange={() => toggle(option.value)}
                                        className="mt-0.5 data-checked:border-primary data-checked:bg-primary"
                                    />

                                    <span className="min-w-0 flex-1">
                                        <span className="block truncate leading-5">
                                            {option.label}
                                        </span>

                                        {option.description && (
                                            <span className="block truncate text-xs leading-4 text-muted-foreground">
                                                {option.description}
                                            </span>
                                        )}
                                    </span>
                                </label>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

export default CheckboxListFilter;
