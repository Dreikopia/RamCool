import { useCallback, useState } from 'react';
import { Pen } from 'lucide-react';
import AppLayout from '@/Layouts/AppLayout';
import StockFormDrawer from '@/components/Inventory/stock-form-drawer';
import { CheckboxListFilter } from '@/components/filters/checkbox-list-filter';
import { FilterBar } from '@/components/filters/filter-bar';
import { FilterTabs } from '@/components/filters/filter-tabs';
import { SearchInput } from '@/components/filters/search-input';
import { DataTableCard } from '@/components/data-table-card';
import { ListEmptyState } from '@/components/list-empty-state';
import ProductStatusBadge from '@/components/products/product-status-badge';
import StockStatusBadge from '@/components/products/status-badge';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { useFilters } from '@/hooks/use-filters';

const STOCK_TABS = [
    { value: 'all', label: 'All' },
    { value: 'in_stock', label: 'In stock' },
    { value: 'low_stock', label: 'Low' },
    { value: 'out_of_stock', label: 'Out of stock' },
];

const DEFAULT_FILTERS = {
    search: '',
    categories: [],
    stock_status: 'all',
};

const ONLY_PROPS = ['inventories', 'categories', 'filters'];

const Index = ({
    inventories = { data: [], links: [], total: 0 },
    categories = [],
    filters: initialFilters,
}) => {
    const [selected, setSelected] = useState(null);
    const [open, setOpen] = useState(false);

    const { filters, setFilter, removeFilters, clearAll, isPending } = useFilters({
        initialFilters,
        defaults: DEFAULT_FILTERS,
        only: ONLY_PROPS,
    });

    const openDrawer = useCallback((inventoryId, mode = 'in') => {
        setSelected({ inventoryId, mode });
        setOpen(true);
    }, []);

    const chips = [];

    if (filters.categories.length > 0) {
        const categoryLabel = filters.categories.length === 1 ? 'category' : 'categories';

        chips.push({
            key: 'categories',
            label: `${filters.categories.length} ${categoryLabel}`,
            onRemove: () => removeFilters(['categories']),
        });
    }

    const activeCount = chips.length;

    const hasFilters =
        filters.search.trim() !== '' ||
        filters.stock_status !== 'all' ||
        activeCount > 0;

    const filterFields = [
        {
            key: 'categories',
            label: 'Categories',
            active: filters.categories.length > 0,
            count: filters.categories.length,
            content: (
                <CheckboxListFilter
                    options={categories.map((category) => ({
                        value: category.id,
                        label: category.name,
                    }))}
                    selected={filters.categories}
                    onChange={(values) => setFilter('categories', values)}
                    searchPlaceholder="Search categories…"
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
                placeholder="Search product or SKU…"
                ariaLabel="Search inventory"
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
                    options={STOCK_TABS}
                    value={filters.stock_status}
                    onChange={(value) => setFilter('stock_status', value)}
                    ariaLabel="Filter by stock status"
                    className="min-w-0"
                />
            </div>
        </div>
    );

    return (
        <div>
            <DataTableCard
                toolbar={toolbar}
                isEmpty={inventories.data.length === 0}
                isPending={isPending}
                paginator={inventories}
                only={ONLY_PROPS}
                itemLabel="inventory items"
                empty={
                    hasFilters ? (
                        <ListEmptyState
                            title="No inventory matches these filters"
                            actionLabel="Clear filters"
                            onAction={clearAll}
                        />
                    ) : (
                        <ListEmptyState
                            title="No inventory yet."
                            description="Products with stock records will show up here."
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
                            <TableHead className="h-9 px-4 text-right text-xs font-medium text-muted-foreground">
                                Current stock
                            </TableHead>
                            <TableHead className="h-9 px-4 text-left text-xs font-medium text-muted-foreground">
                                Category
                            </TableHead>
                            <TableHead className="h-9 px-4 text-right text-xs font-medium text-muted-foreground">
                                Reorder at
                            </TableHead>
                            <TableHead className="h-9 px-4 text-left text-xs font-medium text-muted-foreground">
                                Status
                            </TableHead>
                            <TableHead className="h-9 px-4 text-right text-xs font-medium text-muted-foreground">
                                Action
                            </TableHead>
                        </TableRow>
                    </TableHeader>

                    <TableBody>
                        {inventories.data.map(({ id, product, quantity }) => (
                            <TableRow key={id} className="align-middle">
                                <TableCell className="max-w-[18rem] px-4 py-3 text-left">
                                    <div className="truncate font-medium">{product.name}</div>
                                    <div className="mt-0.5 text-xs text-muted-foreground">
                                        {product.sku}
                                    </div>
                                </TableCell>

                                <TableCell className="px-4 py-3 text-right font-medium tabular-nums">
                                    {quantity}
                                </TableCell>

                                <TableCell className="px-4 py-3 text-left text-sm">
                                    {product.category.name}
                                </TableCell>

                                <TableCell className="px-4 py-3 text-right text-sm tabular-nums text-muted-foreground">
                                    {product.reorder_level}
                                </TableCell>

                                <TableCell className="px-4 py-3 text-left">
                                    <div className="flex flex-wrap items-center gap-1">
                                        <ProductStatusBadge status={product.status} />
                                        <StockStatusBadge status={product.stock_status} />
                                    </div>
                                </TableCell>

                                <TableCell className="px-4 py-3 text-right">
                                    <Button
                                        variant="ghost"
                                        size="icon-sm"
                                        aria-label={`Update stock for ${product.name}`}
                                        title="Update stock"
                                        onClick={() => openDrawer(id, 'in')}
                                    >
                                        <Pen className="size-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </DataTableCard>

            <StockFormDrawer
                open={open}
                onOpenChange={setOpen}
                inventory={
                    selected
                        ? inventories.data.find((inventory) => inventory.id === selected.inventoryId)
                        : null
                }
                initialMode={selected?.mode ?? 'in'}
            />
        </div>
    );
};

Index.layout = (page) => <AppLayout title="Inventory">{page}</AppLayout>;

export default Index;
