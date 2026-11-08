import { useEffect, useState } from 'react';
import { useForm, usePage } from '@inertiajs/react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/components/ui/currency';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Sheet,
    SheetContent,
    SheetFooter,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import {
    Table,
    TableBody,
    TableCell,
    TableFooter,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import SaleStatusBadge from './sale-status-badge';

const formatDate = (value) =>
    value
        ? `${format(new Date(value), 'MMM d, yyyy')} · ${format(new Date(value), 'h:mm a')}`
        : '—';

const SaleInfoDrawer = ({ open, onOpenChange, sale }) => {
    const canVoid = usePage().props.auth?.can?.voidSales ?? false;
    const [confirmingVoid, setConfirmingVoid] = useState(false);

    const { patch, processing, errors, clearErrors } = useForm({});

    useEffect(() => {
        if (!open) {
            setConfirmingVoid(false);
            clearErrors();
        }
    }, [open]);

    const items = sale?.items ?? [];
    const isCompleted = sale?.status === 'completed';
    const isVoided = sale?.status === 'voided';

    const close = () => {
        setConfirmingVoid(false);
        onOpenChange(false);
    };

    const submitVoid = () => {
        patch(`/sales/${sale.id}/void`, {
            preserveScroll: true,
            onSuccess: close,
        });
    };

    return (
        <>
            <Sheet open={open} onOpenChange={onOpenChange}>
                <SheetContent
                    side="right"
                    className="gap-0 data-[side=right]:w-[85vw] data-[side=right]:sm:w-[500px] data-[side=right]:sm:max-w-none"
                >
                    <SheetHeader className="shrink-0 border-b">
                        <div className="pr-10">
                            <div className="flex items-center gap-2">
                                <SheetTitle className="truncate tabular-nums">
                                    {sale?.sales_number}
                                </SheetTitle>
                                <SaleStatusBadge
                                    status={sale?.status}
                                    className="shrink-0"
                                />
                            </div>

                            <p className="mt-1 text-xs text-muted-foreground">
                                {formatDate(sale?.created_at)}
                                {sale?.user?.name
                                    ? ` · sold by ${sale.user.name}`
                                    : ''}
                            </p>

                            {sale?.remarks && (
                                <p className="mt-2 text-sm">
                                    <span className="text-muted-foreground">
                                        Remarks:{' '}
                                    </span>
                                    {sale.remarks}
                                </p>
                            )}

                            {sale?.voided_at && (
                                <p className="mt-1 text-xs text-destructive">
                                    Voided {formatDate(sale.voided_at)}
                                </p>
                            )}
                        </div>
                    </SheetHeader>

                    <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
                        {items.length === 0 ? (
                            <p className="py-6 text-center text-sm text-muted-foreground">
                                No items on this sale.
                            </p>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="px-0">
                                            Product
                                        </TableHead>
                                        <TableHead className="px-0 text-right">
                                            Qty
                                        </TableHead>
                                        <TableHead className="px-0 text-right">
                                            Price
                                        </TableHead>
                                        <TableHead className="px-0 text-right">
                                            Total
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>

                                <TableBody>
                                    {items.map((item) => (
                                        <TableRow key={item.id}>
                                            <TableCell
                                                className={`px-0 whitespace-normal ${isVoided
                                                    ? 'text-muted-foreground'
                                                    : ''
                                                    }`}
                                            >
                                                {item.product?.name ??
                                                    'Deleted product'}
                                            </TableCell>
                                            <TableCell className="px-0 text-right tabular-nums">
                                                {item.quantity}
                                            </TableCell>
                                            <TableCell className="px-0 text-right tabular-nums">
                                                {formatCurrency(item.unit_price)}
                                            </TableCell>
                                            <TableCell className="px-0 text-right font-medium tabular-nums">
                                                {formatCurrency(item.subtotal)}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>

                                <TableFooter>
                                    <TableRow>
                                        <TableCell
                                            colSpan={3}
                                            className="px-0 font-semibold"
                                        >
                                            Total
                                        </TableCell>
                                        <TableCell className="px-0 text-right font-semibold tabular-nums">
                                            {formatCurrency(sale?.total_amount)}
                                        </TableCell>
                                    </TableRow>
                                </TableFooter>
                            </Table>
                        )}
                    </div>

                    <SheetFooter className="shrink-0 border-t sm:flex-row sm:justify-end">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={close}
                            disabled={processing}
                        >
                            Close
                        </Button>

                        {isCompleted && canVoid && (
                            <Button
                                type="button"
                                variant="destructive"
                                onClick={() => setConfirmingVoid(true)}
                                disabled={processing}
                            >
                                Void sale
                            </Button>
                        )}
                    </SheetFooter>
                </SheetContent>
            </Sheet>

            <Dialog open={confirmingVoid} onOpenChange={setConfirmingVoid}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            Void sale {sale?.sales_number}?
                        </DialogTitle>
                        <DialogDescription>
                            This restores the sold quantities to inventory and
                            cannot be undone.
                        </DialogDescription>
                    </DialogHeader>

                    {errors.void && (
                        <p className="text-sm text-destructive">{errors.void}</p>
                    )}

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setConfirmingVoid(false)}
                            disabled={processing}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            variant="destructive"
                            onClick={submitVoid}
                            disabled={processing}
                        >
                            {processing ? 'Voiding…' : 'Void sale'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default SaleInfoDrawer;
