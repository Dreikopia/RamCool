import { useEffect, useState } from 'react';
import { useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Sheet,
    SheetContent,
    SheetFooter,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { Minus, Plus } from 'lucide-react';
import ProductThumbnail from '../products/product-thumbnail';
import ProductStatusBadge from '../products/product-status-badge';
import StockStatusBadge from '../products/status-badge';
import { Textarea } from '../ui/textarea';
import MovementTypeBadge from '../movements/movement-type-badge';

const Field = ({ label, htmlFor, error, className = '', children }) => (
    <div className={`grid gap-1.5 ${className}`}>
        <Label htmlFor={htmlFor}>{label}</Label>
        {children}
        {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
);

const MODES = {
    in: {
        key: 'in',
        tab: 'In',
        sign: '+',
        field: 'quantity',
        fieldLabel: 'Quantity to add',
        url: 'stock-in',
        submitButton: 'Add stock',
        processingLabel: 'Adding…',
    },
    out: {
        key: 'out',
        tab: 'Out',
        sign: '−',
        field: 'quantity',
        fieldLabel: 'Quantity to remove',
        url: 'stock-out',
        submitButton: 'Remove stock',
        processingLabel: 'Removing…',
    },
    adjust: {
        key: 'adjust',
        tab: 'Adjust',
        sign: '=',
        field: 'counted_quantity',
        fieldLabel: 'Counted quantity',
        url: 'adjustment',
        submitButton: 'Save adjustment',
        processingLabel: 'Saving…',
    },
};

const signed = (n) => (n >= 0 ? `+${n}` : `${n}`);

const formatDate = (value) =>
    new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

const previewFor = (mode, amount, current) => {
    if (amount === null) {
        return null;
    }

    if (mode === 'in') {
        return { after: current + amount, delta: amount, blocked: false, zero: false };
    }

    if (mode === 'out') {
        const blocked = amount > current;
        return { after: current - amount, delta: -amount, blocked, zero: false };
    }

    const delta = amount - current;
    return { after: amount, delta, blocked: false, zero: delta === 0 };
};

const StockFormDrawer = ({ open, onOpenChange, inventory, initialMode = 'in', product }) => {
    const [mode, setMode] = useState(initialMode);
    const config = MODES[mode];

    const current = inventory?.quantity ?? 0;
    const movements = inventory?.movements ?? [];

    const { data, setData, transform, reset, post, processing, errors } = useForm({
        quantity: '',
        counted_quantity: '',
        remarks: '',
    });

    useEffect(() => {
        if (open) {
            setMode(initialMode);
            reset();
        }
    }, [open, inventory, initialMode]);

    const rawAmount = data[config.field];
    const amount =
        rawAmount === '' || rawAmount === null ? null : Number(rawAmount);
    const preview = previewFor(mode, amount, current);

    const switchMode = (next) => {
        setMode(next);
        if (next === 'adjust') {
            setData('quantity', '');
        } else {
            setData('counted_quantity', '');
        }
    };

    const minAmount = mode === 'adjust' ? 0 : 1;

    const step = (direction) => {
        const base =
            rawAmount === '' || rawAmount === null ? current : Number(rawAmount);
        const safeBase = Number.isFinite(base) ? base : current;
        setData(config.field, String(Math.max(minAmount, safeBase + direction)));
    };

    const submit = (e) => {
        e.preventDefault();

        transform(() => ({
            quantity: mode === 'adjust' ? preview.delta : amount,
            remarks: data.remarks,
        }));

        post(`/inventories/${inventory.id}/${config.url}`, {
            preserveScroll: true,
            onSuccess: () => onOpenChange(false),
        });
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent
                side="right"
                className="gap-0 data-[side=right]:w-[85vw] data-[side=right]:sm:w-[500px] data-[side=right]:sm:max-w-none"
            >
                <SheetHeader className="shrink-0 border-b">
                    <div className="pr-10">
                        <SheetTitle className="truncate">
                            {inventory?.product?.name}

                        </SheetTitle>
                        <div className="mt-0.5 flex items-center justify-between gap-2">
                            <span className="truncate text-xs text-muted-foreground ">
                                {inventory?.product?.sku}

                            </span>


                        </div>
                    </div>

                    <div className="mt-3 flex items-end justify-between">
                        <div>
                            <p className="text-3xl font-bold leading-none tabular-nums">
                                {current}
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                                Current Stock
                            </p>
                        </div>
                        <div className='gap-y-1'>
                            <div className="flex flex-wrap items-center justify-end gap-1">
                                <ProductStatusBadge
                                    status={inventory?.product?.status}
                                    className="shrink-0"
                                />
                                <StockStatusBadge
                                    status={inventory?.product?.stock_status}
                                    className="shrink-0"
                                />
                            </div>
                            <p className="text-sm text-muted-foreground">
                                Reorder at{'   '}
                                <span className="text-xl font-medium text-foreground">
                                    {inventory?.product?.reorder_level}
                                </span>
                            </p>

                            <div />

                        </div>
                    </div>
                </SheetHeader>

                {inventory && (
                    <div className="mt-3 flex items-center gap-3 rounded-xl border border-sidebar-border bg-muted/40 p-2.5 m-2">
                        <ProductThumbnail product={inventory.product} />

                        <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">{inventory.product.name}</p>
                            <p className="mt-0.5 truncate text-xs text-muted-foreground">
                                {inventory.product.sku}
                                {inventory.product.category?.name ? ` · ${inventory.product.category.name}` : ''}
                            </p>
                        </div>
                    </div>
                )
                }

                <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
                    <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
                        <div
                            className="grid grid-cols-3 gap-2"
                            role="group"
                            aria-label="Movement type"
                        >
                            {Object.values(MODES).map((m) => (
                                <Button
                                    key={m.key}
                                    type="button"
                                    variant={mode === m.key ? 'default' : 'outline'}
                                    onClick={() => switchMode(m.key)}
                                    disabled={processing}
                                    aria-pressed={mode === m.key}
                                >
                                    <span className="mr-1">{m.sign}</span> {m.tab}
                                </Button>
                            ))}
                        </div>

                        <div className="mt-8 grid gap-3">
                            <Field
                                label={config.fieldLabel}
                                htmlFor="stock-amount"
                                error={errors.quantity}
                            >
                                <div className='flex items-center gap-2'>
                                    <Button
                                        type="button"
                                        size='sm'
                                        onClick={() => step(-1)}
                                        disabled={processing || !inventory}
                                        aria-label="Decrease quantity"
                                    >
                                        <Minus />
                                    </Button>
                                    <Input
                                        id="stock-amount"
                                        type="number"
                                        min={minAmount}
                                        step="1"
                                        value={rawAmount}
                                        onChange={(e) => setData(config.field, e.target.value)}
                                        placeholder={String(current)}
                                        aria-invalid={Boolean(errors.quantity)}
                                        disabled={processing || !inventory}
                                        autoFocus
                                        className='w-95'
                                    />
                                    <Button
                                        type="button"
                                        size='sm'
                                        onClick={() => step(1)}
                                        disabled={processing || !inventory}
                                        aria-label="Increase quantity"
                                    >
                                        <Plus />
                                    </Button>
                                </div>

                            </Field>

                            <p
                                className={`text-sm transition-opacity duration-200 ${preview ? 'opacity-100' : 'opacity-0'
                                    }`}
                                aria-live="polite"
                            >
                                {preview?.blocked ? (
                                    <span className="text-destructive">
                                        Not enough stock — only {current} available.
                                    </span>
                                ) : preview?.zero ? (
                                    <span className="text-muted-foreground">
                                        Counted quantity matches stock on hand — nothing
                                        to adjust.
                                    </span>
                                ) : (
                                    <span className="text-muted-foreground">
                                        After saving:{' '}
                                        <span className="tabular-nums">{current}</span> →{' '}
                                        <span className="font-semibold text-foreground tabular-nums">
                                            {preview?.after ?? '—'}
                                        </span>
                                        {preview && (
                                            <>
                                                {' '}
                                                <span
                                                    className={
                                                        preview.delta > 0
                                                            ? 'text-green-500'
                                                            : 'text-red-600'
                                                    }
                                                >
                                                    ({signed(preview.delta)})
                                                </span>
                                            </>
                                        )}
                                    </span>
                                )}
                            </p>

                            <Field
                                label={mode === 'adjust' ? 'Remarks' : 'Remarks (optional)'}
                                htmlFor="stock-remarks"
                                error={errors.remarks}
                                className="pb-1"
                            >
                                <Textarea
                                    id="stock-remarks"
                                    value={data.remarks}
                                    onChange={(e) => setData('remarks', e.target.value)}
                                    placeholder="Enter reason or additional notes... "
                                    disabled={processing}
                                    aria-invalid={Boolean(errors.remarks)}
                                />
                            </Field>

                            <div className="pt-2">
                                <p className="text-xs text-muted-foreground">
                                    Recent movements
                                </p>
                                {movements.length > 0 ? (
                                    <ul className="mt-2 divide-y">
                                        {movements.map((movement) => (
                                            <li
                                                key={movement.id}
                                                className="flex items-center gap-3 py-1.5 text-sm"
                                            >
                                                <span className="w-14 shrink-0 text-xs text-muted-foreground">
                                                    {formatDate(movement.created_at)}
                                                </span>
                                                <span className="flex-1">
                                                    <MovementTypeBadge type={movement.type} />
                                                </span>
                                                <span
                                                    className={`font-medium tabular-nums ${movement.quantity > 0
                                                        ? 'text-green-500'
                                                        : 'text-red-600'
                                                        }`}
                                                >
                                                    {signed(movement.quantity)}
                                                </span>
                                                <span className="w-10 shrink-0 text-right text-xs text-muted-foreground">
                                                    {movement.user?.name ?? '—'}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="mt-2 py-1.5 text-sm text-muted-foreground">
                                        No movements yet — stock activity will show up
                                        here.
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* ── Footer ───────────────────────── */}
                    <SheetFooter className="shrink-0 border-t sm:flex-row sm:justify-end">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={processing}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={
                                processing ||
                                !inventory ||
                                !preview ||
                                preview.blocked ||
                                preview.zero
                            }
                        >
                            {processing ? config.processingLabel : config.submitButton}
                        </Button>
                    </SheetFooter>
                </form>
            </SheetContent >
        </Sheet >
    );
};

export default StockFormDrawer;
