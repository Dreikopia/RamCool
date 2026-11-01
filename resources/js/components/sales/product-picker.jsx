import { useEffect, useRef, useState } from 'react';
import { router } from '@inertiajs/react';
import { Loader2, Plus, Search } from 'lucide-react';
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import ProductThumbnail from '../products/product-thumbnail';
import StockStatusBadge from '../products/status-badge';
import Currency from '../ui/currency';
import { useDebouncedValue } from '@/hooks/use-debounced-value';

const SEARCH_DEBOUNCE_MS = 300;

const stockOf = (product) => product.inventory?.quantity ?? 0;

const ProductPicker = ({ products, productCount, quantityOf, onAdd }) => {
    const [search, setSearch] = useState('');
    const [highlighted, setHighlighted] = useState(-1);
    const [isSearching, setIsSearching] = useState(false);

    const term = search.trim();
    const debouncedTerm = useDebouncedValue(term, SEARCH_DEBOUNCE_MS);
    const requestedTerm = useRef('');

    // The server does the filtering. Only the paused term is sent, and only
    // when it actually changed, so mount and re-renders never cause a visit.
    useEffect(() => {
        if (debouncedTerm === requestedTerm.current) {
            return;
        }

        requestedTerm.current = debouncedTerm;

        router.get(
            '/sales/create',
            debouncedTerm === '' ? {} : { q: debouncedTerm },
            {
                only: ['products'],
                preserveState: true,
                preserveScroll: true,
                replace: true,
                onStart: () => setIsSearching(true),
                onFinish: () => setIsSearching(false),
            },
        );
    }, [debouncedTerm]);

    // A new result set invalidates any keyboard highlight.
    useEffect(() => setHighlighted(-1), [products]);

    useEffect(() => {
        if (highlighted < 0) {
            return;
        }

        document
            .getElementById(`picker-product-${highlighted}`)
            ?.scrollIntoView({ block: 'nearest' });
    }, [highlighted]);

    const moveHighlight = (step) => {
        if (products.length === 0) {
            return;
        }

        setHighlighted((current) =>
            Math.min(Math.max(current + step, 0), products.length - 1),
        );
    };

    const handleSearchKeyDown = (event) => {
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault();
            moveHighlight(event.key === 'ArrowDown' ? 1 : -1);

            return;
        }

        if (event.key !== 'Enter') {
            return;
        }

        // Enter inside the sale form must never submit the sale.
        event.preventDefault();

        const product = products[highlighted];

        if (!product || quantityOf(product.id) >= stockOf(product)) {
            return;
        }

        onAdd(product);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Products</CardTitle>
                <CardAction>
                    <span
                        aria-live="polite"
                        className="text-xs text-muted-foreground tabular-nums"
                    >
                        {term === ''
                            ? `${productCount} products`
                            : `${products.length} of ${productCount}`}
                    </span>
                </CardAction>
            </CardHeader>

            <CardContent className="space-y-3">
                <div className="relative">
                    <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        type="search"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={handleSearchKeyDown}
                        placeholder="Search product name or SKU"
                        aria-label="Search products"
                        aria-describedby="product-picker-hint"
                        className="pl-8"
                    />
                    {isSearching && (
                        <Loader2 className="absolute top-1/2 right-2.5 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
                    )}
                </div>

                {products.length === 0 ? (
                    <p className="py-8 text-center text-sm text-muted-foreground">
                        No products match "{debouncedTerm}".
                    </p>
                ) : (
                    <ul className="max-h-[60vh] divide-y overflow-y-auto overscroll-contain">
                        {products.map((product, index) => {
                            const stock = stockOf(product);
                            const inSale = quantityOf(product.id);
                            const isSoldOut = inSale >= stock;

                            return (
                                <li
                                    key={product.id}
                                    id={`picker-product-${index}`}
                                    className={`flex items-center gap-3 rounded-md px-2 py-3 ${
                                        index === highlighted ? 'bg-muted/60' : ''
                                    } ${isSoldOut ? 'opacity-60' : ''}`}
                                >
                                    <ProductThumbnail product={product} />
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-medium">{product.name}</p>
                                        <p className="truncate text-xs text-muted-foreground">
                                            {product.sku} · {stock} in stock
                                            {inSale > 0 ? ` · ${inSale} in sale` : ''}
                                        </p>
                                        <StockStatusBadge status={product.stock_status} />
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        <Currency
                                            value={product.unit_price}
                                            className="text-sm font-medium"
                                        />
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="outline"
                                            disabled={isSoldOut}
                                            onClick={() => onAdd(product)}
                                            aria-label={`Add ${product.name} to the sale`}
                                        >
                                            <Plus />
                                            Add
                                        </Button>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                )}

                <p id="product-picker-hint" className="text-xs text-muted-foreground">
                    Press Enter to add the highlighted product.
                </p>
            </CardContent>
        </Card>
    );
};

export default ProductPicker;
