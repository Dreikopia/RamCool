import { useState } from 'react';
import { Link } from '@inertiajs/react';
import { format } from 'date-fns';
import AppLayout from '@/Layouts/AppLayout';
import { DataTableCard } from '@/components/data-table-card';
import { CheckboxListFilter } from '@/components/filters/checkbox-list-filter';
import { DateRangeFilter, getDateRangeLabel } from '@/components/filters/date-range-filter';
import { FilterBar } from '@/components/filters/filter-bar';
import { FilterTabs } from '@/components/filters/filter-tabs';
import { SearchInput } from '@/components/filters/search-input';
import { ListEmptyState } from '@/components/list-empty-state';
import SaleInfoDrawer from '@/components/sales/sale-info-drawer';
import SaleStatusBadge from '@/components/sales/sale-status-badge';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/components/ui/currency';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { useFilters } from '@/hooks/use-filters';

const STATUS_OPTIONS = [
    { value: 'all', label: 'All' },
    { value: 'completed', label: 'Completed' },
    { value: 'voided', label: 'Voided' },
];

const DEFAULT_FILTERS = {
    search: '',
    status: 'all',
    users: [],
    from: '',
    to: '',
};

const ONLY_PROPS = ['sales', 'users', 'filters'];

const Index = ({
    sales = { data: [], links: [], total: 0 },
    users = [],
    filters: initialFilters,
}) => {
    const [selectedSale, setSelectedSale] = useState(null);
    const [drawerOpen, setDrawerOpen] = useState(false);

    const { filters, setFilter, setFilters, removeFilters, clearAll, isPending } = useFilters({
        initialFilters,
        defaults: DEFAULT_FILTERS,
        only: ONLY_PROPS,
    });

    const openSale = (sale) => {
        setSelectedSale(sale);
        setDrawerOpen(true);
    };

    const dateLabel = getDateRangeLabel(filters.from, filters.to);

    const chips = [];

    if (dateLabel) {
        chips.push({
            key: 'date',
            label: dateLabel,
            onRemove: () => removeFilters(['from', 'to']),
        });
    }

    if (filters.users.length > 0) {
        const userLabel = filters.users.length === 1 ? 'cashier' : 'cashiers';

        chips.push({
            key: 'users',
            label: `${filters.users.length} ${userLabel}`,
            onRemove: () => removeFilters(['users']),
        });
    }

    const activeCount = chips.length;

    const hasFilters =
        filters.search.trim() !== '' ||
        filters.status !== 'all' ||
        activeCount > 0;

    const filterFields = [
        {
            key: 'date',
            label: 'Date',
            active: Boolean(dateLabel),
            content: (
                <DateRangeFilter
                    value={{ from: filters.from, to: filters.to }}
                    onChange={(range) => setFilters(range)}
                />
            ),
        },
        {
            key: 'users',
            label: 'Cashiers',
            active: filters.users.length > 0,
            count: filters.users.length,
            content: (
                <CheckboxListFilter
                    options={users.map((user) => ({
                        value: user.id,
                        label: user.name,
                    }))}
                    selected={filters.users}
                    onChange={(values) => setFilter('users', values)}
                    searchPlaceholder="Search cashiers…"
                    listClassName="max-h-[min(55vh,20rem)]"
                />
            ),
        },
    ];

    const toolbar = (
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <SearchInput
                value={filters.search}
                onChange={(value) => setFilter('search', value)}
                placeholder="Search sale number or remarks…"
                ariaLabel="Search sales"
                className="w-full lg:w-70"
            />

            <FilterBar
                fields={filterFields}
                activeCount={activeCount}
                chips={chips}
                canClear={hasFilters}
                onClearAll={clearAll}
            />

            <div className="ml-auto flex flex-wrap items-center gap-2">
                <FilterTabs
                    options={STATUS_OPTIONS}
                    value={filters.status}
                    onChange={(value) => setFilter('status', value)}
                    ariaLabel="Filter by sale status"
                    className="min-w-0"
                />

                <Button
                    nativeButton={false}
                    render={<Link href="/sales/create" />}
                    size="sm"
                >
                    New sale
                </Button>
            </div>
        </div>
    );

    return (
        <div>
            <DataTableCard
                toolbar={toolbar}
                isEmpty={sales.data.length === 0}
                isPending={isPending}
                paginator={sales}
                only={ONLY_PROPS}
                itemLabel="sales"
                empty={
                    hasFilters ? (
                        <ListEmptyState
                            title="No sales match these filters"
                            actionLabel="Clear filters"
                            onAction={clearAll}
                        />
                    ) : (
                        <ListEmptyState
                            title="No sales yet."
                            description="Completed and voided sales will show up here."
                        />
                    )
                }
            >
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/40 hover:bg-muted/40">
                            <TableHead className="h-9 px-4 text-left text-xs font-medium text-muted-foreground">
                                Sale
                            </TableHead>
                            <TableHead className="h-9 px-4 text-right text-xs font-medium text-muted-foreground">
                                Items
                            </TableHead>
                            <TableHead className="h-9 px-4 text-right text-xs font-medium text-muted-foreground">
                                Total
                            </TableHead>
                            <TableHead className="h-9 px-4 text-left text-xs font-medium text-muted-foreground">
                                Status
                            </TableHead>
                            <TableHead className="h-9 px-4 text-left text-xs font-medium text-muted-foreground">
                                By
                            </TableHead>
                            <TableHead className="h-9 px-4 text-right text-xs font-medium text-muted-foreground">
                                Date
                            </TableHead>
                            <TableHead className="h-9 px-4 text-right text-xs font-medium text-muted-foreground">
                                Actions
                            </TableHead>
                        </TableRow>
                    </TableHeader>

                    <TableBody>
                        {sales.data.map((sale) => (
                            <TableRow
                                key={sale.id}
                                className={
                                    sale.status === 'voided'
                                        ? 'align-middle text-muted-foreground'
                                        : 'align-middle'
                                }
                            >
                                <TableCell className="px-4 py-2 text-left font-medium tabular-nums">
                                    {sale.sales_number}
                                </TableCell>

                                <TableCell className="px-4 py-2 text-right tabular-nums">
                                    {sale.items_count}
                                </TableCell>

                                <TableCell className="px-4 py-2 text-right font-medium">
                                    {formatCurrency(sale.total_amount)}
                                </TableCell>

                                <TableCell className="px-4 py-2 text-left">
                                    <SaleStatusBadge status={sale.status} />
                                </TableCell>

                                <TableCell className="px-4 py-2 text-left text-sm">
                                    {sale.user?.name ?? '—'}
                                </TableCell>

                                <TableCell className="px-4 py-2 text-right text-sm text-muted-foreground">
                                    <time
                                        dateTime={sale.created_at}
                                        className="tabular-nums"
                                    >
                                        {format(
                                            new Date(sale.created_at),
                                            'MMM d, yyyy · h:mm a',
                                        )}
                                    </time>
                                </TableCell>

                                <TableCell className="px-4 py-2 text-right">
                                    <Button
                                        size="xs"
                                        variant="outline"
                                        onClick={() => openSale(sale)}
                                    >
                                        View
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </DataTableCard>

            <SaleInfoDrawer
                open={drawerOpen}
                onOpenChange={setDrawerOpen}
                sale={selectedSale}
            />
        </div>
    );
};

Index.layout = (page) => <AppLayout title="Sales">{page}</AppLayout>;

export default Index;
