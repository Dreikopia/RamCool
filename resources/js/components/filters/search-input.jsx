import { useEffect, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from 'cn';

/**
 * Debounced search field that keeps its own text while typing.
 *
 * The parent owns the real `value` (usually from the URL). This component only
 * calls `onChange` after the user stops typing for `delay` milliseconds.
 */
export function SearchInput({
    value = '',
    onChange,
    placeholder = 'Search…',
    ariaLabel = 'Search',
    delay = 300,
    className,
}) {
    const [query, setQuery] = useState(value);
    const timerRef = useRef(null);
    const inputRef = useRef(null);

    // Cancel any pending request when the field disappears.
    useEffect(() => () => clearTimeout(timerRef.current), []);

    // Adopt external changes such as "Clear all" or browser back/forward.
    // We skip this while the user is typing so a slow response cannot erase
    // characters that were typed after the request started.
    useEffect(() => {
        if (document.activeElement === inputRef.current) {
            return;
        }

        clearTimeout(timerRef.current);
        setQuery(value);
    }, [value]);

    const handleChange = (event) => {
        const next = event.target.value;
        setQuery(next);

        clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
            onChange(next.trim());
        }, delay);
    };

    const handleClear = () => {
        clearTimeout(timerRef.current);
        setQuery('');
        inputRef.current?.focus();
        onChange('');
    };

    return (
        <div className={cn('relative', className)}>
            <Search
                className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
            />

            <Input
                ref={inputRef}
                value={query}
                onChange={handleChange}
                placeholder={placeholder}
                aria-label={ariaLabel}
                className="h-8 bg-background pr-8 pl-8 text-sm shadow-xs"
            />

            {query && (
                <button
                    type="button"
                    onClick={handleClear}
                    aria-label="Clear search"
                    className="absolute top-1/2 right-1 flex size-5 -translate-y-1/2 items-center justify-center rounded-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                    <X className="size-3" />
                </button>
            )}
        </div>
    );
}

export default SearchInput;
