import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import AppLayout from '@/Layouts/AppLayout';
import { CheckboxListFilter } from '@/components/filters/checkbox-list-filter';
import { DateRangeFilter, getDateRangeLabel } from '@/components/filters/date-range-filter';
import { FilterBar } from '@/components/filters/filter-bar';
import { FilterTabs } from '@/components/filters/filter-tabs';
import { SearchInput } from '@/components/filters/search-input';
import MovementTypeBadge from '@/components/movements/movement-type-badge';
import { useFilters } from '@/hooks/use-filters';
import { cn } from 'cn';

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

const Index = ({ movements = [], products = [], users = [], filters: initialFilters }) => {
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

    return (
        <div className="p-2 sm:p-6">
            <div className="rounded-xl border border-border bg-card shadow-sm">
                <div className="border-b border-border p-3">
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
                </div>

                {movements.length === 0 ? (
                    hasFilters ? (
                        <div className="py-12 text-center">
                            <p className="text-muted-foreground">
                                No movements match these filters
                            </p>

                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="mt-4"
                                onClick={clearAll}
                            >
                                Clear filters
                            </Button>
                        </div>
                    ) : (
                        <div className="py-12 text-center">
                            <p className="text-muted-foreground">No movements yet.</p>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Stock changes will show up here once inventory is added or adjusted.
                            </p>
                        </div>
                    )
                ) : (
                    <div
                        className={cn(
                            'transition-opacity',
                            isPending && 'pointer-events-none opacity-60',
                        )}
                    >
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="px-3 text-left">When</TableHead>
                                    <TableHead className="px-3 text-left">Product</TableHead>
                                    <TableHead className="px-3 text-left">Type</TableHead>
                                    <TableHead className="px-3 text-right">Change</TableHead>
                                    <TableHead className="px-3 text-left">Remarks</TableHead>
                                    <TableHead className="px-3 text-left">By</TableHead>
                                </TableRow>
                            </TableHeader>

                            <TableBody>
                                {movements.map((movement) => (
                                    <TableRow key={movement.id}>
                                        <TableCell className="px-3 text-left">
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

                                        <TableCell className="px-3 text-left">
                                            <div>{movement.inventory?.product?.name}</div>
                                            <div className="text-xs text-muted-foreground">
                                                {movement.inventory?.product?.sku}
                                            </div>
                                        </TableCell>

                                        <TableCell className="px-3 text-left">
                                            <MovementTypeBadge type={movement.type} />
                                        </TableCell>

                                        <TableCell className="px-3 text-right font-medium tabular-nums">
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

                                        <TableCell className="max-w-[10rem] truncate px-3 text-left text-sm text-muted-foreground">
                                            {movement.remarks ?? '—'}
                                        </TableCell>

                                        <TableCell className="px-3 text-left">
                                            {movement.user?.name ?? 'System'}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </div>
        </div>
    );
};

Index.layout = (page) => <AppLayout title="Movements">{page}</AppLayout>;

export default Index;