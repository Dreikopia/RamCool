import { useCallback, useEffect, useRef, useState } from 'react';
import { router } from '@inertiajs/react';

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

const isBlank = (value) =>
    value === null ||
    value === undefined ||
    value === '' ||
    (Array.isArray(value) && value.length === 0);

const isSameValue = (left, right) => {
    if (Array.isArray(left) && Array.isArray(right)) {
        return (
            left.length === right.length &&
            left.every((value, index) => String(value) === String(right[index]))
        );
    }

    return left === right;
};

const isSameFilters = (left, right) =>
    Object.keys(right).every((key) => isSameValue(left[key], right[key]));

/**
 * Fill in any missing filter keys with their defaults.
 * Arrays are copied so callers cannot accidentally mutate shared defaults.
 */
const normalizeFilters = (incoming, defaults) => {
    const normalized = { ...defaults };

    Object.keys(defaults).forEach((key) => {
        const value = incoming?.[key];

        if (value === null || value === undefined) {
            normalized[key] = Array.isArray(defaults[key]) ? [...defaults[key]] : defaults[key];

            return;
        }

        normalized[key] = Array.isArray(defaults[key])
            ? (Array.isArray(value) ? [...value] : [...defaults[key]])
            : value;
    });

    return normalized;
};

/**
 * Turn filters into a query object for Inertia.
 *
 * Removed filters are set to `undefined` (instead of being left out) because
 * Inertia merges new query data with the current URL. Passing `undefined`
 * tells it to drop the old value. `page` is reset the same way.
 */
const buildQuery = (values, defaults) => {
    const query = { page: undefined };

    Object.entries(values).forEach(([key, value]) => {
        const shouldRemove = isBlank(value) || isSameValue(value, defaults[key]);

        query[key] = shouldRemove ? undefined : value;
    });

    return query;
};

// ---------------------------------------------------------------------------
// useFilters
// ---------------------------------------------------------------------------

/**
 * Keeps filter state in the URL and in sync with the server.
 *
 * Usage:
 *   const { filters, setFilter, setFilters, removeFilters, clearAll } =
 *       useFilters({ initialFilters, defaults, only: ['movements'] });
 *
 * `defaults` and `only` should be stable values (defined outside the component)
 * so the hook does not rebuild its callbacks on every render.
 */
export function useFilters({ initialFilters = {}, defaults = {}, only = [] }) {
    const [filters, setLocalFilters] = useState(() =>
        normalizeFilters(initialFilters, defaults),
    );
    const [isPending, setIsPending] = useState(false);

    // A ref lets rapid clicks read the latest values, even before React has
    // re-rendered the component.
    const filtersRef = useRef(filters);
    filtersRef.current = filters;

    // Adopt filters sent by the server. This covers browser back/forward and
    // any visit that was triggered from somewhere else. Returning the current
    // state when nothing changed avoids unnecessary re-renders.
    useEffect(() => {
        const normalized = normalizeFilters(initialFilters, defaults);

        setLocalFilters((current) =>
            isSameFilters(normalized, current) ? current : normalized,
        );
    }, [initialFilters, defaults]);

    const visit = useCallback(
        (next) => {
            router.get(window.location.pathname, buildQuery(next, defaults), {
                only,
                preserveState: true,
                preserveScroll: true,
                replace: true,
                onStart: () => setIsPending(true),
                onFinish: () => setIsPending(false),
            });
        },
        [defaults, only],
    );

    const setFilters = useCallback(
        (patch) => {
            const next = { ...filtersRef.current, ...patch };

            if (isSameFilters(next, filtersRef.current)) {
                return;
            }

            filtersRef.current = next;
            setLocalFilters(next);
            visit(next);
        },
        [visit],
    );

    const setFilter = useCallback(
        (key, value) => setFilters({ [key]: value }),
        [setFilters],
    );

    /**
     * Reset specific keys back to their defaults. Used by chip remove buttons.
     * Example: removeFilters(['products']) leaves every other filter untouched.
     */
    const removeFilters = useCallback(
        (keys) => {
            const patch = {};

            keys.forEach((key) => {
                patch[key] = defaults[key];
            });

            setFilters(patch);
        },
        [defaults, setFilters],
    );

    const clearAll = useCallback(() => {
        setFilters(defaults);
    }, [defaults, setFilters]);

    return {
        filters,
        setFilter,
        setFilters,
        removeFilters,
        clearAll,
        isPending,
    };
}
