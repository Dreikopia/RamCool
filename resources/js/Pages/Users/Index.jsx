import AppLayout from '@/Layouts/AppLayout';
import { DataTableCard } from '@/components/data-table-card';
import { ListEmptyState } from '@/components/list-empty-state';
import UserStatusBadge from '@/components/users/user-status-badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

const HEAD = 'h-9 px-4 text-left text-xs font-medium text-muted-foreground';

const Index = ({ users = { data: [], links: [], total: 0 } }) => {
    return (
        <DataTableCard
            isEmpty={users.data.length === 0}
            paginator={users}
            only={['users']}
            itemLabel="users"
            empty={
                <ListEmptyState
                    title="No users yet."
                    description="Create a user to give someone access."
                />
            }
        >
            <Table>
                <TableHeader>
                    <TableRow className="bg-muted/40 hover:bg-muted/40">
                        <TableHead className={HEAD}>Name</TableHead>
                        <TableHead className={HEAD}>Email</TableHead>
                        <TableHead className={HEAD}>Role</TableHead>
                        <TableHead className={HEAD}>Status</TableHead>
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
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </DataTableCard>
    );
};

Index.layout = (page) => <AppLayout title="Manage Users">{page}</AppLayout>;

export default Index;
