import { format } from 'date-fns';
import { Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import MovementTypeBadge from '@/components/movements/movement-type-badge';
import StockStatusBadge from '@/components/products/status-badge';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { formatCurrency } from '@/components/ui/currency';

const RESTOCK_LIMIT = 8;

const signed = (quantity) => (quantity > 0 ? `+${quantity}` : `${quantity}`);

const Index = ({ kpis, restockItems, movements }) => {
    const cards = [
        { label: 'Total revenue', value: formatCurrency(kpis.total_revenue) },
        { label: 'Total products', value: kpis.total_products },
        {
            label: 'Low stock',
            value: kpis.low_stock_count,
            tone:
                kpis.low_stock_count > 0
                    ? 'text-amber-600 dark:text-amber-400'
                    : '',
        },
        {
            label: 'Out of stock',
            value: kpis.out_of_stock_count,
            tone:
                kpis.out_of_stock_count > 0
                    ? 'text-red-600 dark:text-red-400'
                    : '',
        },
    ];

    const visibleRestock = restockItems.slice(0, RESTOCK_LIMIT);

    return (
        <div className="space-y-4">
            <section
                className="grid grid-cols-4 gap-4 sm:grid-cols-4 xl:grid-cols-4"
                aria-label="Key figures"
            >
                {cards.map((card) => (
                    <Card key={card.label}>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                {card.label}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div
                                className={`text-2xl font-semibold tracking-tight tabular-nums sm:text-3xl ${card.tone ?? ''}`}
                            >
                                {card.value}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </section>

            <div className="grid gap-4 lg:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Needs restocking</CardTitle>
                        <CardDescription>
                            At or below reorder level, most urgent first
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {restockItems.length === 0 ? (
                            <p className="py-8 text-center text-sm text-muted-foreground">
                                Nothing needs restocking. Every product is above
                                its reorder level.
                            </p>
                        ) : (
                            <ul>
                                {visibleRestock.map((product) => {
                                    const quantity = product.inventory?.quantity ?? 0;

                                    return (
                                        <li
                                            key={product.id}
                                            className="flex items-center justify-between gap-3 border-t border-sidebar-border py-2.5 first:border-t-0 first:pt-0 last:pb-0"
                                        >
                                            <div className="min-w-0">
                                                <div className="truncate font-medium">
                                                    {product.name}
                                                </div>
                                                <div className="truncate text-xs text-muted-foreground">
                                                    {product.sku}
                                                    {product.category?.name
                                                        ? `, ${product.category.name}`
                                                        : ''}
                                                </div>
                                            </div>

                                            <div className="flex shrink-0 items-center gap-2">
                                                <span className="text-sm text-muted-foreground tabular-nums">
                                                    {quantity} / {product.reorder_level}
                                                </span>
                                                <StockStatusBadge
                                                    status={product.stock_status}
                                                />
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </CardContent>
                    {restockItems.length > RESTOCK_LIMIT && (
                        <CardFooter>
                            <Link
                                href="/inventories"
                                className="text-sm font-medium text-primary hover:underline"
                            >
                                See all {restockItems.length} in inventory
                            </Link>
                        </CardFooter>
                    )}
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Latest movements</CardTitle>
                        <CardDescription>Newest stock changes first</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {movements.length === 0 ? (
                            <p className="py-8 text-center text-sm text-muted-foreground">
                                No movements yet. Stock changes will show up here
                                once inventory is added or adjusted.
                            </p>
                        ) : (
                            <ul>
                                {movements.map((movement) => (
                                    <li
                                        key={movement.id}
                                        className="flex items-center gap-3 border-t border-sidebar-border py-2.5 first:border-t-0 first:pt-0 last:pb-0"
                                    >
                                        <MovementTypeBadge type={movement.type} />

                                        <div className="min-w-0 flex-1">
                                            <div className="truncate text-sm font-medium">
                                                {movement.inventory?.product?.name}
                                            </div>
                                            <div className="truncate text-xs text-muted-foreground">
                                                <time dateTime={movement.created_at}>
                                                    {format(
                                                        new Date(movement.created_at),
                                                        'MMM d, h:mm a',
                                                    )}
                                                </time>
                                                {', '}
                                                {movement.user?.name ?? 'System'}
                                            </div>
                                        </div>

                                        <span
                                            className={`shrink-0 font-medium tabular-nums ${movement.quantity > 0
                                                ? 'text-green-600 dark:text-green-400'
                                                : 'text-red-600 dark:text-red-400'
                                                }`}
                                        >
                                            {signed(movement.quantity)}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </CardContent>
                    <CardFooter>
                        <Link
                            href="/movements"
                            className="text-sm font-medium text-primary hover:underline"
                        >
                            View all movements
                        </Link>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
};

Index.layout = (page) => <AppLayout>{page}</AppLayout>;

export default Index;
