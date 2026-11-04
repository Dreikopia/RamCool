import { useState } from 'react';
import { format } from 'date-fns';
import { Link, router } from '@inertiajs/react';
import {
    ArrowDownLeft,
    ArrowUpRight,
    Minus,
    Package,
    PackageX,
    TrendingDown,
    TrendingUp,
    TriangleAlert,
    Wallet,
} from 'lucide-react';
import { cn } from 'cn';
import AppLayout from '@/Layouts/AppLayout';
import StockFormDrawer from '@/components/Inventory/stock-form-drawer';
import SalesByCategoryChart from '@/components/dashboard/sales-by-category-chart';
import SalesPerformanceChart from '@/components/dashboard/sales-performance-chart';
import MovementTypeBadge from '@/components/movements/movement-type-badge';
import ProductThumbnail from '@/components/products/product-thumbnail';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardAction,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { formatCurrency } from '@/components/ui/currency';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

const GRANULARITY_OPTIONS = [
    { value: 'monthly', label: 'Monthly' },
    { value: 'weekly', label: 'Weekly' },
];

const SCROLL_AREA =
    '[scrollbar-color:var(--border)_transparent] [scrollbar-width:thin]';

const signed = (quantity) => (quantity > 0 ? `+${quantity}` : `${quantity}`);

const movementNumber = (id) => `#MOV-${String(id).padStart(4, '0')}`;

const formatMovementDate = (value) => format(new Date(value), 'MMM d, yyyy');

const TREND_STYLES = {
    up: 'border-transparent bg-green-500/15 text-green-700 dark:text-green-400',
    down: 'border-transparent bg-destructive/15 text-destructive',
    flat: 'border-transparent bg-muted text-muted-foreground',
};

const RevenueTrend = ({ percent }) => {
    if (percent === null) {
        return null;
    }

    const direction = percent > 0 ? 'up' : percent < 0 ? 'down' : 'flat';
    const Icon =
        direction === 'up'
            ? TrendingUp
            : direction === 'down'
                ? TrendingDown
                : Minus;

    return (
        <Badge variant="outline" className={TREND_STYLES[direction]}>
            <Icon aria-hidden="true" />
            {Math.abs(percent).toFixed(1)}%
        </Badge>
    );
};

const KpiCard = ({ label, value, icon: Icon, tone, support, trend }) => (
    <Card className="h-full">
        <CardHeader>
            <div className="flex items-center justify-between gap-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                    {label}
                </CardTitle>
                <span
                    className={cn(
                        'flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted',
                        tone,
                    )}
                >
                    <Icon className="size-4" aria-hidden="true" />
                </span>
            </div>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col justify-between gap-3">
            <div
                className={cn(
                    'text-2xl font-semibold tracking-tight tabular-nums sm:text-3xl',
                    tone,
                )}
            >
                {value}
            </div>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                {trend !== undefined && <RevenueTrend percent={trend} />}
                <span>{support}</span>
            </div>
        </CardContent>
    </Card>
);

const MovementRow = ({ movement }) => {
    const isStockIn = movement.quantity > 0;
    const Icon = isStockIn ? ArrowDownLeft : ArrowUpRight;

    return (
        <li className="flex items-center gap-3 py-3">
            <span
                className={cn(
                    'flex size-10 shrink-0 items-center justify-center rounded-lg',
                    isStockIn
                        ? 'bg-green-500/15 text-green-700 dark:text-green-400'
                        : 'bg-destructive/15 text-destructive',
                )}
            >
                <Icon className="size-4" aria-hidden="true" />
            </span>

            <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">
                    {movement.inventory?.product?.name ?? '—'}
                </div>
                <div className="truncate text-xs text-muted-foreground tabular-nums">
                    {movementNumber(movement.id)} ·{' '}
                    <time dateTime={movement.created_at}>
                        {formatMovementDate(movement.created_at)}
                    </time>
                </div>
            </div>

            <div className="flex shrink-0 items-center gap-3">
                <MovementTypeBadge type={movement.type} />
                <span
                    className={cn(
                        'w-12 text-right text-sm font-semibold tabular-nums',
                        isStockIn
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-red-600 dark:text-red-400',
                    )}
                >
                    {signed(movement.quantity)}
                </span>
            </div>
        </li>
    );
};

const RecentMovementsCard = ({ movements }) => (
    <Card className="flex h-full flex-col lg:col-span-7 p-2">
        <CardHeader>
            <CardTitle>Recent movements</CardTitle>
            <CardAction>
                <Link
                    href="/movements"
                    className="text-sm font-medium text-primary hover:underline"
                >
                    View all
                </Link>
            </CardAction>
        </CardHeader>
        <CardContent className="flex-1">
            {movements.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                    No movements yet. Stock changes will show up here once
                    inventory is added or adjusted.
                </p>
            ) : (
                <ul
                    className={cn(
                        '-mx-1 max-h-[19rem] divide-y divide-sidebar-border overflow-y-auto px-1',
                        SCROLL_AREA,
                    )}
                >
                    {movements.map((movement) => (
                        <MovementRow key={movement.id} movement={movement} />
                    ))}
                </ul>
            )}
        </CardContent>
    </Card>
);

const Index = ({
    kpis,
    salesTrend,
    weeklySalesTrend,
    salesByCategory,
    restockItems,
    movements,
}) => {
    const [granularity, setGranularity] = useState('monthly');
    const [restockInventory, setRestockInventory] = useState(null);
    const [restockOpen, setRestockOpen] = useState(false);

    const openRestockDrawer = (product) => {
        if (!product.inventory) {
            router.visit('/inventories');

            return;
        }

        setRestockInventory({ ...product.inventory, product });
        setRestockOpen(true);
    };

    const stockShare = (count) =>
        kpis.total_products > 0
            ? Math.round((count / kpis.total_products) * 100)
            : 0;

    const cards = [
        {
            label: 'Total revenue',
            value: formatCurrency(kpis.total_revenue),
            icon: Wallet,
            support:
                kpis.revenue_trend_percent === null
                    ? 'No prior month to compare'
                    : 'vs last month',
            trend: kpis.revenue_trend_percent,
        },
        {
            label: 'Total products',
            value: kpis.total_products,
            icon: Package,
            support: `${kpis.products_added_recently} added in the last 30 days`,
        },
        {
            label: 'Low stock',
            value: kpis.low_stock_count,
            icon: TriangleAlert,
            tone:
                kpis.low_stock_count > 0
                    ? 'text-amber-600 dark:text-amber-400'
                    : '',
            support: `${stockShare(kpis.low_stock_count)}% of catalog at or below reorder level`,
        },
        {
            label: 'Out of stock',
            value: kpis.out_of_stock_count,
            icon: PackageX,
            tone:
                kpis.out_of_stock_count > 0
                    ? 'text-red-600 dark:text-red-400'
                    : '',
            support: `${stockShare(kpis.out_of_stock_count)}% of catalog unavailable`,
        },
    ];

    const trendData =
        granularity === 'weekly' ? weeklySalesTrend : salesTrend;

    return (
        <div className="space-y-6">
            <section
                className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
                aria-label="Key figures"
            >
                {cards.map((card) => (
                    <KpiCard key={card.label} {...card} />
                ))}
            </section>

            <div className="grid gap-6 lg:grid-cols-12">
                <Card className="flex h-full flex-col lg:col-span-8">
                    <CardHeader>
                        <CardTitle>Sales performance</CardTitle>
                        <CardAction>
                            <Select
                                value={granularity}
                                onValueChange={setGranularity}
                                items={GRANULARITY_OPTIONS}
                            >
                                <SelectTrigger
                                    size="sm"
                                    className="w-28"
                                    aria-label="Sales performance range"
                                >
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {GRANULARITY_OPTIONS.map((option) => (
                                        <SelectItem
                                            key={option.value}
                                            value={option.value}
                                        >
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </CardAction>
                    </CardHeader>
                    <CardContent className="flex flex-1 flex-col justify-center">
                        <SalesPerformanceChart
                            data={trendData}
                            granularity={granularity}
                        />
                    </CardContent>
                </Card>

                <Card className="flex h-full flex-col lg:col-span-4">
                    <CardHeader>
                        <CardTitle>Sales by category</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-1 flex-col justify-center">
                        <SalesByCategoryChart data={salesByCategory} />
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-12">
                <RecentMovementsCard movements={movements ?? []} />

                <Card className="flex h-full flex-col lg:col-span-5">
                    <CardHeader>
                        <CardTitle>Products needing restocking</CardTitle>
                        <CardAction>
                            <Link
                                href="/inventories"
                                className="text-sm font-medium text-primary hover:underline"
                            >
                                View all
                            </Link>
                        </CardAction>
                    </CardHeader>
                    <CardContent className="flex-1">
                        {restockItems.length === 0 ? (
                            <p className="py-8 text-center text-sm text-muted-foreground">
                                Nothing needs restocking. Every product is above
                                its reorder level.
                            </p>
                        ) : (
                            <ul
                                className={cn(
                                    '-mx-1 max-h-[19rem] divide-y divide-sidebar-border overflow-y-auto px-1',
                                    SCROLL_AREA,
                                )}
                            >
                                {restockItems.map((product) => {
                                    const quantity =
                                        product.inventory?.quantity ?? 0;

                                    return (
                                        <li
                                            key={product.id}
                                            className="flex items-center gap-3 py-3"
                                        >
                                            <ProductThumbnail
                                                product={product}
                                                className="size-10"
                                            />

                                            <div className="min-w-0 flex-1">
                                                <div className="truncate text-sm font-medium">
                                                    {product.name}
                                                </div>
                                                <div className="truncate text-xs text-muted-foreground">
                                                    {product.sku}
                                                </div>
                                            </div>

                                            <div className="flex shrink-0 items-center gap-2">
                                                <Badge
                                                    variant="outline"
                                                    className={
                                                        quantity === 0
                                                            ? 'border-transparent bg-destructive/15 text-destructive'
                                                            : 'border-transparent bg-amber-500/15 text-amber-700 dark:text-amber-400'
                                                    }
                                                >
                                                    {quantity} left
                                                </Badge>
                                                <Button
                                                    size="xs"
                                                    variant="outline"
                                                    onClick={() =>
                                                        openRestockDrawer(
                                                            product,
                                                        )
                                                    }
                                                >
                                                    Restock
                                                </Button>
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </CardContent>
                </Card>
            </div>

            <StockFormDrawer
                open={restockOpen}
                onOpenChange={setRestockOpen}
                inventory={restockInventory}
                initialMode="in"
            />
        </div>
    );
};

Index.layout = (page) => <AppLayout title="Dashboard">{page}</AppLayout>;

export default Index;