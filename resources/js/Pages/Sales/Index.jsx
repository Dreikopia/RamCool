import { useState } from 'react';
import { format } from 'date-fns';
import { Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
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

const Index = ({ sales }) => {
    const [selectedSale, setSelectedSale] = useState(null);
    const [drawerOpen, setDrawerOpen] = useState(false);

    const openSale = (sale) => {
        setSelectedSale(sale);
        setDrawerOpen(true);
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">Sales</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Everything sold, newest first
                    </p>
                </div>

                <Button render={<Link href="/sales/create" />}>New sale</Button>
            </div>

            {sales.data.length === 0 ? (
                <div className="rounded-xl border border-sidebar-border bg-card py-12 text-center">
                    <p className="text-muted-foreground">No sales yet.</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Completed and voided sales will show up here.
                    </p>
                </div>
            ) : (
                <div className="rounded-xl border border-sidebar-border bg-card">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Sale</TableHead>
                                <TableHead>When</TableHead>
                                <TableHead className="text-center">Items</TableHead>
                                <TableHead className="text-left">Total</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>By</TableHead>
                                <TableHead>Action</TableHead>
                            </TableRow>
                        </TableHeader>

                        <TableBody>
                            {sales.data.map((sale) => (
                                <TableRow
                                    key={sale.id}
                                    className={
                                        sale.status === 'voided'
                                            ? 'text-muted-foreground'
                                            : undefined
                                    }
                                >
                                    <TableCell className="font-medium tabular-nums">
                                        {sale.sales_number}
                                    </TableCell>

                                    <TableCell>
                                        <time dateTime={sale.created_at} className="tabular-nums">
                                            {format(new Date(sale.created_at), 'MMM d, h:mm a')}
                                        </time>
                                    </TableCell>

                                    <TableCell className="text-center tabular-nums">
                                        {sale.items_count}
                                    </TableCell>

                                    <TableCell className="text-left font-medium tabular-nums">
                                        {formatCurrency(sale.total_amount)}
                                    </TableCell>

                                    <TableCell>
                                        <SaleStatusBadge status={sale.status} />
                                    </TableCell>

                                    <TableCell>{sale.user?.name ?? '—'}</TableCell>
                                    <TableCell>
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
                </div>
            )
            }

            <SaleInfoDrawer
                open={drawerOpen}
                onOpenChange={setDrawerOpen}
                sale={selectedSale}
            />
        </div >
    );
};

Index.layout = (page) => <AppLayout>{page}</AppLayout>;

export default Index;
