import { useState } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import CategoryDeleteDialog from '@/components/categories/category-delete-dialog';
import CategoryFormModal from '@/components/categories/category-form-modal';
import CategoryRowActions from '@/components/categories/category-row-actions';
import { DataTableCard } from '@/components/data-table-card';
import { FilterTabs } from '@/components/filters/filter-tabs';
import { SearchInput } from '@/components/filters/search-input';
import { ListEmptyState } from '@/components/list-empty-state';
import { Badge } from '@/components/ui/badge';
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

const PRODUCT_TABS = [
    { value: 'all', label: 'All' },
    { value: 'with', label: 'With products' },
    { value: 'empty', label: 'Empty' },
];

const DEFAULT_FILTERS = {
    search: '',
    has_products: 'all',
};

const ONLY_PROPS = ['categories', 'filters'];

const Index = ({
    categories = { data: [], links: [], total: 0 },
    filters: initialFilters,
}) => {
    const [modal, setModal] = useState({ open: false, category: null });
    const [deleting, setDeleting] = useState(null);

    const { filters, setFilter, clearAll, isPending } = useFilters({
        initialFilters,
        defaults: DEFAULT_FILTERS,
        only: ONLY_PROPS,
    });

    const openCreate = () => setModal({ open: true, category: null });
    const openEdit = (category) => setModal({ open: true, category });

    const hasFilters =
        filters.search.trim() !== '' || filters.has_products !== 'all';

    const toolbar = (
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <SearchInput
                value={filters.search}
                onChange={(value) => setFilter('search', value)}
                placeholder="Search by name…"
                ariaLabel="Search categories"
                className="w-full lg:w-70"
            />

            <div className="ml-auto flex flex-wrap items-center gap-2">
                <FilterTabs
                    options={PRODUCT_TABS}
                    value={filters.has_products}
                    onChange={(value) => setFilter('has_products', value)}
                    ariaLabel="Filter categories by products"
                    className="min-w-0"
                />

                <Button onClick={openCreate} variant="secondary" size="sm">
                    Add category
                </Button>
            </div>
        </div>
    );

    return (
        <>
            <DataTableCard
                toolbar={toolbar}
                isEmpty={categories.data.length === 0}
                isPending={isPending}
                paginator={categories}
                only={ONLY_PROPS}
                itemLabel="categories"
                empty={
                    hasFilters ? (
                        <ListEmptyState
                            title="No categories match these filters"
                            actionLabel="Clear filters"
                            onAction={clearAll}
                        />
                    ) : (
                        <ListEmptyState
                            title="No categories yet."
                            description="Add a category to organize your products."
                            actionLabel="Add your first category"
                            onAction={openCreate}
                        />
                    )
                }
            >
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/40 hover:bg-muted/40">
                            <TableHead className="h-9 px-4 text-left text-xs font-medium text-muted-foreground">
                                Category
                            </TableHead>
                            <TableHead className="h-9 px-4 text-left text-xs font-medium text-muted-foreground">
                                Description
                            </TableHead>
                            <TableHead className="h-9 px-4 text-right text-xs font-medium text-muted-foreground">
                                Products
                            </TableHead>
                            <TableHead className="h-9 px-4 text-right text-xs font-medium text-muted-foreground">
                                Actions
                            </TableHead>
                        </TableRow>
                    </TableHeader>

                    <TableBody>
                        {categories.data.map((category) => (
                            <TableRow key={category.id} className="align-middle">
                                <TableCell className="px-4 py-2 text-left font-medium">
                                    {category.name}
                                </TableCell>

                                <TableCell className="max-w-[28rem] truncate px-4 py-2 text-left text-sm text-muted-foreground">
                                    {category.description ?? '—'}
                                </TableCell>

                                <TableCell className="px-4 py-2 text-right">
                                    <Badge variant="secondary">
                                        {category.products_count} products
                                    </Badge>
                                </TableCell>

                                <TableCell className="px-4 py-2 text-right">
                                    <div className="flex justify-end">
                                        <CategoryRowActions
                                            category={category}
                                            onEdit={openEdit}
                                            onDelete={setDeleting}
                                        />
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </DataTableCard>

            <CategoryFormModal
                open={modal.open}
                onOpenChange={(open) => setModal((current) => ({ ...current, open }))}
                category={modal.category}
            />

            <CategoryDeleteDialog
                category={deleting}
                onOpenChange={(open) => {
                    if (!open) {
                        setDeleting(null);
                    }
                }}
            />
        </>
    );
};

Index.layout = (page) => <AppLayout title="Categories">{page}</AppLayout>;

export default Index;
