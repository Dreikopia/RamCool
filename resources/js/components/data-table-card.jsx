import { DataPagination } from '@/components/data-pagination';
import { cn } from 'cn';

/**
 * Shared shell for list pages.
 *
 * Keeps the toolbar, table, empty state, and pagination in the same place on
 * every page so the look stays consistent as new list pages are added.
 */
export function DataTableCard({
    toolbar,
    isEmpty = false,
    empty = null,
    paginator,
    only = [],
    itemLabel = 'results',
    isPending = false,
    children,
    className,
}) {
    return (
        <div className={cn('rounded-xl border border-border bg-card shadow-sm', className)}>
            {toolbar && <div className="border-b border-border p-3">{toolbar}</div>}

            {isEmpty ? (
                empty
            ) : (
                <div
                    className={cn(
                        'transition-opacity',
                        isPending && 'pointer-events-none opacity-60',
                    )}
                >
                    {children}

                    {paginator && (
                        <DataPagination
                            paginator={paginator}
                            only={only}
                            itemLabel={itemLabel}
                            className="px-4"
                        />
                    )}
                </div>
            )}
        </div>
    );
}

export default DataTableCard;
