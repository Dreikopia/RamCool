import { useEffect, useState } from 'react';

/**
 * Returns `value` only after it has stopped changing for `delay` milliseconds.
 *
 * Typing stays instant because the input keeps its own un-debounced state;
 * only the expensive consumer (a server request) waits for the pause.
 */
export function useDebouncedValue(value, delay = 300) {
    const [debounced, setDebounced] = useState(value);

    useEffect(() => {
        const timeout = setTimeout(() => setDebounced(value), delay);

        return () => clearTimeout(timeout);
    }, [value, delay]);

    return debounced;
}
