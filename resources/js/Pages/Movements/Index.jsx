import { format } from 'date-fns';
import AppLayout from '@/Layouts/AppLayout';
import { DataTableCard } from '@/components/data-table-card';
import { CheckboxListFilter } from '@/components/filters/checkbox-list-filter';
import { DateRangeFilter, getDateRangeLabel } from '@/components/filters/date-range-filter';
import { FilterBar } from '@/components/filters/filter-bar';
import { FilterTabs } from '@/components/filters/filter-tabs';
import { SearchInput } from '@/components/filters/search-input';
import { ListEmptyState } from '@/components/list-empty-state';
import MovementTypeBadge from '@/components/movements/movement-type-badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { useFilters } from '@/hooks/use-filters';

const signed = (quantity) => (quantity > 0 ? `+${quantity}` : `${quantity}`);

const TYPE_TABS = [
    { value: 'all', label: 'All' },
    { value: 'stock_in', label: 'Stock in' },
    { value: 'stock_out', label: 'Stock out' },
    { value: 'adjustment', label: 'Adjustment' },
];

const DEFAULT_FILTERS = {
    search: '',
    type: 'all',
    products: [],
    users: [],
    from: '',
    to: '',
};

const ONLY_PROPS = ['movements', 'filters', 'products', 'users'];

const Index = ({
    movements = { data: [], links: [], total: 0 },
    products = [],
    users = [],
    filters: initialFilters,
}) => {
    const { filters, setFilter, setFilters, removeFilters, clearAll, isPending } = useFilters({
        initialFilters,
        defaults: DEFAULT_FILTERS,
        only: ONLY_PROPS,
    });

    const dateLabel = getDateRangeLabel(filters.from, filters.to);

    const chips = [];

    if (dateLabel) {
        chips.push({
            key: 'date',
            label: dateLabel,
            onRemove: () => removeFilters(['from', 'to']),
        });
    }

    if (filters.products.length > 0) {
        const productLabel = filters.products.length === 1 ? 'product' : 'products';

        chips.push({
            key: 'products',
            label: `${filters.products.length} ${productLabel}`,
            onRemove: () => removeFilters(['products']),
        });
    }

    if (filters.users.length > 0) {
        const userLabel = filters.users.length === 1 ? 'user' : 'users';

        chips.push({
            key: 'users',
            label: `${filters.users.length} ${userLabel}`,
            onRemove: () => removeFilters(['users']),
        });
    }

    const activeCount = chips.length;

    const hasFilters =
        filters.search.trim() !== '' || filters.type !== 'all' || activeCount > 0;

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
            key: 'products',
            label: 'Products',
            active: filters.products.length > 0,
            count: filters.products.length,
            content: (
                <CheckboxListFilter
                    options={products.map((product) => ({
                        value: product.id,
                        label: product.name,
                        description: product.sku,
                    }))}
                    selected={filters.products}
                    onChange={(values) => setFilter('products', values)}
                    searchPlaceholder="Search products…"
                    listClassName="max-h-[min(55vh,20rem)]"
                />
            ),
        },
        {
            key: 'users',
            label: 'Users',
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
                    searchPlaceholder="Search users…"
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
                placeholder="Search product, SKU, or Remarks…"
                ariaLabel="Search movements"
                className="w-full lg:w-70"
            />

            <FilterBar
                fields={filterFields}
                activeCount={activeCount}
                chips={chips}
                canClear={hasFilters}
                onClearAll={clearAll}
            />

            <div className="ml-auto">
                <FilterTabs
                    options={TYPE_TABS}
                    value={filters.type}
                    onChange={(value) => setFilter('type', value)}
                    ariaLabel="Filter by movement type"
                    className="min-w-0"
                />
            </div>
        </div>
    );

    return (
        <DataTableCard
            toolbar={toolbar}
            isEmpty={movements.data.length === 0}
            isPending={isPending}
            paginator={movements}
            only={ONLY_PROPS}
            itemLabel="movements"
            empty={
                hasFilters ? (
                    <ListEmptyState
                        title="No movements match these filters"
                        actionLabel="Clear filters"
                        onAction={clearAll}
                    />
                ) : (
                    <ListEmptyState
                        title="No movements yet."
                        description="Stock changes will show up here once inventory is added or adjusted."
                    />
                )
            }
        >
            <Table>
                <TableHeader>
                    <TableRow className="bg-muted/40 hover:bg-muted/40">
                        <TableHead className="h-9 px-4 text-left text-xs font-medium text-muted-foreground">
                            Product
                        </TableHead>
                        <TableHead className="h-9 px-4 text-left text-xs font-medium text-muted-foreground">
                            Type
                        </TableHead>
                        <TableHead className="h-9 px-4 text-right text-xs font-medium text-muted-foreground">
                            Change
                        </TableHead>
                        <TableHead className="h-9 px-4 text-left text-xs font-medium text-muted-foreground">
                            Remarks
                        </TableHead>
                        <TableHead className="h-9 px-4 text-left text-xs font-medium text-muted-foreground">
                            By
                        </TableHead>
                        <TableHead className="h-9 px-4 text-right text-xs font-medium text-muted-foreground">
                            Date
                        </TableHead>
                    </TableRow>
                </TableHeader>

                <TableBody>
                    {movements.data.map((movement) => (
                        <TableRow key={movement.id} className="align-middle">
                            <TableCell className="max-w-[16rem] px-4 py-2 text-left">
                                <div className="truncate font-medium">
                                    {movement.inventory?.product?.name}
                                </div>
                                <div className="mt-0.5 text-xs text-muted-foreground">
                                    {movement.inventory?.product?.sku}
                                </div>
                            </TableCell>

                            <TableCell className="px-4 py-2 text-left">
                                <MovementTypeBadge type={movement.type} />
                            </TableCell>

                            <TableCell className="px-4 py-2 text-right font-medium tabular-nums">
                                <span
                                    className={
                                        movement.quantity > 0
                                            ? 'text-green-600 dark:text-green-400'
                                            : 'text-red-600 dark:text-red-400'
                                    }
                                >
                                    {signed(movement.quantity)}
                                </span>
                            </TableCell>

                            <TableCell className="max-w-[18rem] truncate px-4 py-2 text-left text-sm text-muted-foreground">
                                {movement.remarks ?? '—'}
                            </TableCell>

                            <TableCell className="px-4 py-2 text-left text-sm">
                                {movement.user?.name ?? 'System'}
                            </TableCell>

                            <TableCell className="px-4 py-2 text-right text-sm text-muted-foreground">
                                <time
                                    dateTime={movement.created_at}
                                    className="tabular-nums"
                                >
                                    {format(
                                        new Date(movement.created_at),
                                        'MMM d, yyyy · h:mm a',
                                    )}
                                </time>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </DataTableCard>
    );
};

Index.layout = (page) => <AppLayout title="Movements">{page}</AppLayout>;

export default Index;
