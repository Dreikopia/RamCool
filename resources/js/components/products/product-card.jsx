import { Truck } from 'lucide-react';
import ProductRowActions from '@/components/products/product-row-actions';
import ProductStatusBadge from '@/components/products/product-status-badge';
import ProductThumbnail from '@/components/products/product-thumbnail';
import StockStatusBadge from '@/components/products/status-badge';
import Currency from '@/components/ui/currency';
import { cn } from 'cn';

const statusValue = (status) =>
    typeof status === 'string' ? status : (status?.value ?? null);

const ProductCard = ({ product, canManage, onEdit, onDelete, onToggleStatus, disabled }) => {
    const isInactive = statusValue(product.status) === 'inactive';

    return (
        <li
            className={cn(
                'flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-colors',
                onEdit && 'cursor-pointer hover:border-ring/60',
            )}
            onClick={onEdit ? () => onEdit(product) : undefined}
        >
            <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
                <ProductThumbnail
                    product={product}
                    className={cn('size-full rounded-none', isInactive && 'grayscale')}
                />

                {isInactive && (
                    <div className="absolute top-2 left-2 rounded-full bg-background/90 px-2 py-0.5 shadow-xs backdrop-blur-sm">
                        <ProductStatusBadge status={product.status} />
                    </div>
                )}
            </div>

            <div className="flex flex-1 flex-col gap-1 p-3">
                <div className="flex items-start gap-2">
                    {onEdit ? (
                        <button
                            type="button"
                            className="line-clamp-2 min-w-0 flex-1 rounded-sm text-left font-medium leading-snug outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            onClick={(event) => {
                                event.stopPropagation();
                                onEdit(product);
                            }}
                        >
                            {product.name}
                        </button>
                    ) : (
                        <div className="line-clamp-2 min-w-0 flex-1 font-medium leading-snug">
                            {product.name}
                        </div>
                    )}

                    {canManage && (
                        <div
                            className="-mt-1 -mr-1 shrink-0"
                            onClick={(event) => event.stopPropagation()}
                        >
                            <ProductRowActions
                                product={product}
                                onEdit={onEdit}
                                onDelete={onDelete}
                                onToggleStatus={onToggleStatus}
                                disabled={disabled}
                            />
                        </div>
                    )}
                </div>

                <p className="text-xs tabular-nums text-muted-foreground">{product.sku}</p>

                {product.category?.name && (
                    <p className="truncate text-sm text-muted-foreground">
                        {product.category.name}
                    </p>
                )}

                {product.supplier?.name && (
                    <p className="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
                        <Truck className="size-3.5 shrink-0" aria-hidden="true" />
                        <span className="truncate">{product.supplier.name}</span>
                    </p>
                )}

                <div className="mt-auto flex items-end justify-between gap-2 pt-3">
                    <Currency className="font-semibold" value={product.unit_price} />

                    <div className="flex flex-col items-end gap-1">
                        <span className="text-xs tabular-nums text-muted-foreground">
                            {product.in_stock} on hand
                        </span>
                        <StockStatusBadge status={product.stock_status} />
                    </div>
                </div>
            </div>
        </li>
    );
};

export default ProductCard;
