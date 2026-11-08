import { useState } from 'react';
import { usePage } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { DataTableCard } from '@/components/data-table-card';
import { FilterTabs } from '@/components/filters/filter-tabs';
import { SearchInput } from '@/components/filters/search-input';
import { ListEmptyState } from '@/components/list-empty-state';
import SupplierDialog from '@/components/suppliers/supplier-dialog';
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

const STATUS_OPTIONS = [
    { value: 'all', label: 'All' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
];

const DEFAULT_FILTERS = {
    search: '',
    status: 'all',
};

const ONLY_PROPS = ['suppliers', 'filters'];

const Index = ({
    suppliers = { data: [], links: [], total: 0 },
    filters: initialFilters,
}) => {
    const canManage = usePage().props.auth?.can?.manageCatalog ?? false;

    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedSupplier, setSelectedSupplier] = useState(null);

    const { filters, setFilter, clearAll, isPending } = useFilters({
        initialFilters,
        defaults: DEFAULT_FILTERS,
        only: ONLY_PROPS,
    });

    const openCreate = () => {
        setSelectedSupplier(null);
        setDialogOpen(true);
    };

    const openEdit = (supplier) => {
        setSelectedSupplier(supplier);
        setDialogOpen(true);
    };

    const hasFilters =
        filters.search.trim() !== '' || filters.status !== 'all';

    const toolbar = (
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <SearchInput
                value={filters.search}
                onChange={(value) => setFilter('search', value)}
                placeholder="Search name, contact, phone, or email…"
                ariaLabel="Search suppliers"
                className="w-full lg:w-70"
            />

            <div className="ml-auto flex flex-wrap items-center gap-2">
                <FilterTabs
                    options={STATUS_OPTIONS}
                    value={filters.status}
                    onChange={(value) => setFilter('status', value)}
                    ariaLabel="Filter suppliers by status"
                    className="min-w-0"
                />

                {canManage && (
                    <Button onClick={openCreate} variant="secondary" size="sm">
                        Add supplier
                    </Button>
                )}
            </div>
        </div>
    );

    return (
        <>
            <DataTableCard
                toolbar={toolbar}
                isEmpty={suppliers.data.length === 0}
                isPending={isPending}
                paginator={suppliers}
                only={ONLY_PROPS}
                itemLabel="suppliers"
                empty={
                    hasFilters ? (
                        <ListEmptyState
                            title="No suppliers match these filters"
                            actionLabel="Clear filters"
                            onAction={clearAll}
                        />
                    ) : (
                        <ListEmptyState
                            title="No suppliers yet."
                            description="Add a supplier to link products to where they came from."
                            actionLabel={canManage ? 'Add your first supplier' : undefined}
                            onAction={canManage ? openCreate : undefined}
                        />
                    )
                }
            >
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/40 hover:bg-muted/40">
                            <TableHead className="h-9 px-4 text-left text-xs font-medium text-muted-foreground">
                                Name
                            </TableHead>
                            <TableHead className="h-9 px-4 text-left text-xs font-medium text-muted-foreground">
                                Contact person
                            </TableHead>
                            <TableHead className="h-9 px-4 text-left text-xs font-medium text-muted-foreground">
                                Phone
                            </TableHead>
                            <TableHead className="h-9 px-4 text-left text-xs font-medium text-muted-foreground">
                                Email
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
                        {suppliers.data.map((supplier) => (
                            <TableRow key={supplier.id} className="align-middle">
                                <TableCell className="px-4 py-2 text-left font-medium">
                                    {supplier.name}
                                </TableCell>

                                <TableCell className="px-4 py-2 text-left text-sm">
                                    {supplier.contact_person ?? '—'}
                                </TableCell>

                                <TableCell className="px-4 py-2 text-left text-sm tabular-nums">
                                    {supplier.phone ?? '—'}
                                </TableCell>

                                <TableCell className="px-4 py-2 text-left text-sm">
                                    {supplier.email ?? '—'}
                                </TableCell>

                                <TableCell className="px-4 py-2 text-left">
                                    <Badge
                                        variant="outline"
                                        className={
                                            supplier.is_active
                                                ? 'border-transparent bg-sky-500/15 text-sky-700 dark:text-sky-400'
                                                : 'border-transparent bg-muted text-muted-foreground'
                                        }
                                    >
                                        {supplier.is_active ? 'Active' : 'Inactive'}
                                    </Badge>
                                </TableCell>

                                {canManage && (
                                    <TableCell className="px-4 py-2 text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => openEdit(supplier)}
                                            >
                                                Edit
                                            </Button>
                                        </div>
                                    </TableCell>
                                )}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </DataTableCard>

            <SupplierDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                supplier={selectedSupplier}
            />
        </>
    );
};

Index.layout = (page) => <AppLayout title="Suppliers">{page}</AppLayout>;

export default Index;
