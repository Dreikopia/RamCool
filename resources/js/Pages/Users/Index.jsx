import AppLayout from '@/Layouts/AppLayout';
import { DataTableCard } from '@/components/data-table-card';
import { FilterTabs } from '@/components/filters/filter-tabs';
import { SearchInput } from '@/components/filters/search-input';
import { ListEmptyState } from '@/components/list-empty-state';
import { TableFiller } from '@/components/table-filler';
import UserStatusBadge from '@/components/users/user-status-badge';
import UserFormModal from '@/components/users/user-form-modal';
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
import { useState } from 'react';

const STATUS_OPTIONS = [
    { value: 'all', label: 'All' },
    { value: 'active', label: 'Active' },
    { value: 'pending', label: 'Pending' },
    { value: 'disabled', label: 'Disabled' },
];

const DEFAULT_FILTERS = {
    search: '',
    status: 'all',
};

const ONLY_PROPS = ['users', 'filters'];

const HEAD = 'h-9 px-4 text-left text-xs font-medium text-muted-foreground';

const Index = ({
    users = { data: [], links: [], total: 0 },
    filters: initialFilters,
}) => {
    const [formOpen, setFormOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);

    const openCreate = () => {
        setEditingUser(null);
        setFormOpen(true);
    };

    const openEdit = (user) => {
        setEditingUser(user);
        setFormOpen(true);
    };

    const { filters, setFilter, clearAll, isPending } = useFilters({
        initialFilters,
        defaults: DEFAULT_FILTERS,
        only: ONLY_PROPS,
    });

    const hasFilters =
        filters.search.trim() !== '' || filters.status !== 'all';

    const toolbar = (
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <SearchInput
                value={filters.search}
                onChange={(value) => setFilter('search', value)}
                placeholder="Search name or email…"
                ariaLabel="Search users"
                className="w-full lg:w-70"
            />

            <div className="ml-auto flex flex-wrap items-center gap-2">
                <FilterTabs
                    options={STATUS_OPTIONS}
                    value={filters.status}
                    onChange={(value) => setFilter('status', value)}
                    ariaLabel="Filter users by status"
                    className="min-w-0"
                />

                <Button onClick={openCreate} size="sm">
                    Add user
                </Button>
            </div>
        </div>
    );

    return (
        <>
            <DataTableCard
                toolbar={toolbar}
                isEmpty={users.data.length === 0}
                isPending={isPending}
                paginator={users}
                only={ONLY_PROPS}
                itemLabel="users"
                empty={
                    hasFilters ? (
                        <ListEmptyState
                            title="No users match these filters"
                            actionLabel="Clear filters"
                            onAction={clearAll}
                        />
                    ) : (
                        <ListEmptyState
                            title="No users yet."
                            description="Create a user to give someone access."
                            actionLabel="Add your first user"
                            onAction={openCreate}
                        />
                    )
                }
            >
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/40 hover:bg-muted/40">
                            <TableHead className={HEAD}>Name</TableHead>
                            <TableHead className={HEAD}>Email</TableHead>
                            <TableHead className={HEAD}>Role</TableHead>
                            <TableHead className={HEAD}>Status</TableHead>
                            <TableHead className={HEAD}>Action</TableHead>
                        </TableRow>
                    </TableHeader>

                    <TableBody>
                        {users.data.map((user) => (
                            <TableRow key={user.id} className="align-middle">
                                <TableCell className="px-4 py-2 text-left font-medium">
                                    {user.name}
                                </TableCell>
                                <TableCell className="px-4 py-2 text-left text-sm text-muted-foreground">
                                    {user.email}
                                </TableCell>
                                <TableCell className="px-4 py-2 text-left text-sm capitalize">
                                    {user.role}
                                </TableCell>
                                <TableCell className="px-4 py-2 text-left">
                                    <UserStatusBadge status={user.status} />
                                </TableCell>
                                <TableCell className="px-4 py-2 text-left">
                                    <Button size="sm" onClick={() => openEdit(user)}>
                                        Edit
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                        <TableFiller rows={8 - users.data.length} cols={5} />
                    </TableBody>
                </Table>
            </DataTableCard>

            <UserFormModal open={formOpen} onOpenChange={setFormOpen} user={editingUser} />
        </>
    );
};

Index.layout = (page) => <AppLayout title="Manage Users">{page}</AppLayout>;

export default Index;
