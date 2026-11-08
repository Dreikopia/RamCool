import { useCallback, useState } from 'react';
import { usePage } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { DataTableCard } from '@/components/data-table-card';
import { CheckboxListFilter } from '@/components/filters/checkbox-list-filter';
import { FilterBar } from '@/components/filters/filter-bar';
import { FilterTabs } from '@/components/filters/filter-tabs';
import { SearchInput } from '@/components/filters/search-input';
import { ListEmptyState } from '@/components/list-empty-state';
import ProductFormDrawer from '@/components/products/product-form-drawer';
import ProductRowActions from '@/components/products/product-row-actions';
import ProductStatusBadge from '@/components/products/product-status-badge';
import ProductThumbnail from '@/components/products/product-thumbnail';
import { Button } from '@/components/ui/button';
import Currency from '@/components/ui/currency';
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
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
];

const DEFAULT_FILTERS = {
    search: '',
    status: 'all',
    categories: [],
    suppliers: [],
};

const ONLY_PROPS = ['products', 'categories', 'suppliers', 'filters'];

const Index = ({
    products = { data: [], links: [], total: 0 },
    categories = [],
    suppliers = [],
    filters: initialFilters,
}) => {
    const canManage = usePage().props.auth?.can?.manageCatalog ?? false;

    const [drawer, setDrawer] = useState({ open: false, product: null });

    const { filters, setFilter, removeFilters, clearAll, isPending } = useFilters({
        initialFilters,
        defaults: DEFAULT_FILTERS,
        only: ONLY_PROPS,
    });

    const openCreate = useCallback(() => setDrawer({ open: true, product: null }), []);
    const openEdit = useCallback((product) => setDrawer({ open: true, product }), []);

    const chips = [];

    if (filters.categories.length > 0) {
        const categoryLabel = filters.categories.length === 1 ? 'category' : 'categories';

        chips.push({
            key: 'categories',
            label: `${filters.categories.length} ${categoryLabel}`,
            onRemove: () => removeFilters(['categories']),
        });
    }

    if (filters.suppliers.length > 0) {
        const supplierLabel = filters.suppliers.length === 1 ? 'supplier' : 'suppliers';

        chips.push({
            key: 'suppliers',
            label: `${filters.suppliers.length} ${supplierLabel}`,
            onRemove: () => removeFilters(['suppliers']),
        });
    }

    const activeCount = chips.length;

    const hasFilters =
        filters.search.trim() !== '' ||
        filters.status !== 'all' ||
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
        {
            key: 'suppliers',
            label: 'Suppliers',
            active: filters.suppliers.length > 0,
            count: filters.suppliers.length,
            content: (
                <CheckboxListFilter
                    options={suppliers.map((supplier) => ({
                        value: supplier.id,
                        label: supplier.name,
                    }))}
                    selected={filters.suppliers}
                    onChange={(values) => setFilter('suppliers', values)}
                    searchPlaceholder="Search suppliers…"
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
                placeholder="Search name or SKU…"
                ariaLabel="Search products"
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
                    ariaLabel="Filter by product status"
                    className="min-w-0"
                />

                {canManage && (
                    <Button onClick={openCreate} size="sm">
                        New product
                    </Button>
                )}
            </div>
        </div>
    );

    return (
        <>
            <DataTableCard
                toolbar={toolbar}
                isEmpty={products.data.length === 0}
                isPending={isPending}
                paginator={products}
                only={ONLY_PROPS}
                itemLabel="products"
                empty={
                    hasFilters ? (
                        <ListEmptyState
                            title="No products match these filters"
                            actionLabel="Clear filters"
                            onAction={clearAll}
                        />
                    ) : (
                        <ListEmptyState
                            title="No products yet."
                            description="Add your first product to start tracking inventory."
                            actionLabel={canManage ? 'Add your first product' : undefined}
                            onAction={canManage ? openCreate : undefined}
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
                                Unit Price
                            </TableHead>
                            <TableHead className="h-9 px-4 text-left text-xs font-medium text-muted-foreground">
                                Category
                            </TableHead>
                            <TableHead className="h-9 px-4 text-left text-xs font-medium text-muted-foreground">
                                Supplier
                            </TableHead>
                            <TableHead className="h-9 px-4 text-right text-xs font-medium text-muted-foreground">
                                Quantity
                            </TableHead>
                            <TableHead className="h-9 px-4 text-left text-xs font-medium text-muted-foreground">
                                Status
                            </TableHead>
                            {canManage && (
                                <TableHead className="h-9 px-4 text-right text-xs font-medium text-muted-foreground">
                                    Actions
                                </TableHead>
                            )}
                        </TableRow>
                    </TableHeader>

                    <TableBody>
                        {products.data.map((product) => (
                            <TableRow key={product.id} className="align-middle">
                                <TableCell className="px-4 py-2 text-left">
                                    <div className="flex items-center gap-3">
                                        <ProductThumbnail
                                            product={product}
                                            className="size-9 rounded-md"
                                        />

                                        <div className="min-w-0">
                                            <div className="max-w-[12rem] truncate font-medium">
                                                {product.name}
                                            </div>
                                            <div className="mt-0.5 text-xs text-muted-foreground">
                                                {product.sku}
                                            </div>
                                        </div>
                                    </div>
                                </TableCell>

                                <TableCell className="px-4 py-2 text-left font-medium">
                                    <Currency value={product.unit_price} />
                                </TableCell>

                                <TableCell className="px-4 py-2 text-left text-sm">
                                    {product.category?.name ?? '—'}
                                </TableCell>

                                <TableCell className="px-4 py-2 text-left text-sm">
                                    {product.supplier?.name ?? '—'}
                                </TableCell>

                                <TableCell className="px-4 py-2 text-right font-medium tabular-nums">
                                    {product.in_stock}
                                </TableCell>

                                <TableCell className="px-4 py-2 text-left">
                                    <ProductStatusBadge status={product.status} />
                                </TableCell>

                                {canManage && (
                                    <TableCell className="px-4 py-2 text-right">
                                        <div className="flex justify-end">
                                            <ProductRowActions product={product} onEdit={openEdit} />
                                        </div>
                                    </TableCell>
                                )}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </DataTableCard>

            <ProductFormDrawer
                open={drawer.open}
                onOpenChange={(open) => setDrawer((current) => ({ ...current, open }))}
                product={drawer.product}
                categories={categories}
                suppliers={suppliers}
            />
        </>
    );
};

Index.layout = (page) => <AppLayout title="Products">{page}</AppLayout>;

export default Index;
