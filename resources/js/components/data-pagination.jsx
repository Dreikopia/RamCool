import { router } from '@inertiajs/react';
import { cn } from 'cn';
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from '@/components/ui/pagination';

const toPath = (url) => {
    if (!url) {
        return null;
    }

    const parsed = new URL(url, window.location.origin);

    return `${parsed.pathname}${parsed.search}`;
};

const isPageLink = (link) => /^\d+$/.test(link.label);

export function DataPagination({
    paginator,
    only = [],
    className,
    itemLabel = 'results',
}) {
    if (!paginator || paginator.total === 0) {
        return null;
    }

    const { links = [], current_page: currentPage, last_page: lastPage, from, to, total } = paginator;

    const previous = links[0];
    const next = links[links.length - 1];
    const pages = links.slice(1, -1);
    const canGoPrevious = currentPage > 1;
    const canGoNext = currentPage < lastPage;

    const visit = (event, url) => {
        if (!url) {
            event.preventDefault();
            return;
        }

        event.preventDefault();

        router.get(toPath(url), {}, {
            only,
            preserveState: true,
            preserveScroll: true,
        });
    };

    return (
        <div
            className={cn(
                'flex flex-col gap-3 border-t border-border px-3 py-3 sm:flex-row sm:items-center sm:justify-between',
                className,
            )}
        >
            <p
                className="text-sm whitespace-nowrap text-muted-foreground"
                aria-live="polite"
            >
                Showing <span className="font-medium text-foreground">{from ?? 0}</span>
                {'–'}
                <span className="font-medium text-foreground">{to ?? 0}</span> of{' '}
                <span className="font-medium text-foreground">{total}</span> {itemLabel}
            </p>

            {lastPage > 1 && (
                <Pagination className="mx-0 w-full justify-end sm:w-auto">
                    <PaginationContent>
                        <PaginationItem>
                            <PaginationPrevious
                                href={canGoPrevious ? previous?.url : undefined}
                                aria-disabled={!canGoPrevious}
                                tabIndex={canGoPrevious ? undefined : -1}
                                className={cn(!canGoPrevious && 'pointer-events-none opacity-50')}
                                onClick={(event) =>
                                    visit(event, canGoPrevious ? previous?.url : null)
                                }
                            />
                        </PaginationItem>

                        {pages.map((link, index) => (
                            <PaginationItem key={`${link.label}-${index}`}>
                                {isPageLink(link) ? (
                                    <PaginationLink
                                        href={link.url ?? undefined}
                                        isActive={link.active || link.label === String(currentPage)}
                                        onClick={(event) => visit(event, link.url)}
                                    >
                                        {link.label}
                                    </PaginationLink>
                                ) : (
                                    <PaginationEllipsis />
                                )}
                            </PaginationItem>
                        ))}

                        <PaginationItem>
                            <PaginationNext
                                href={canGoNext ? next?.url : undefined}
                                aria-disabled={!canGoNext}
                                tabIndex={canGoNext ? undefined : -1}
                                className={cn(!canGoNext && 'pointer-events-none opacity-50')}
                                onClick={(event) => visit(event, canGoNext ? next?.url : null)}
                            />
                        </PaginationItem>
                    </PaginationContent>
                </Pagination>
            )}
        </div>
    );
}

export default DataPagination;