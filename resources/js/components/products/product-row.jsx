import { memo } from 'react';
import ProductRowActions from '@/components/products/product-row-actions';
import ProductStatusBadge from '@/components/products/product-status-badge';
import ProductThumbnail from '@/components/products/product-thumbnail';
import StockStatusBadge from '@/components/products/status-badge';
import { cn } from 'cn';
import Currency from '../ui/currency';


const ProductRow = memo(({ product, className, onEdit, onDelete }) => (
  <li
    className={cn(
      'flex items-center gap-4 p-3 transition-colors',
      onEdit && 'cursor-pointer hover:bg-muted/60',
      className,
    )}
    onClick={onEdit ? () => onEdit(product) : undefined}
  >
    <ProductThumbnail product={product} />

    {/* Name + meta line — the button gives keyboard users a way in, and its
        click bubbles to the row handler. */}
    <div className="min-w-0 flex-1">
      <button
        type="button"
        className="block w-full max-w-full truncate rounded-sm text-left font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {product.name}
      </button>

      <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
        <span>{product.sku}</span>
        <span aria-hidden="true">·</span>
        <span>{product.category?.name}</span>
        <span aria-hidden="true">·</span>
        <span className="tabular-nums">{product.in_stock} in stock</span>

        <ProductStatusBadge status={product.status} />
        <StockStatusBadge status={product.stock_status} />
      </div>
    </div>

    {/* Price */}
    <div className="shrink-0 text-right">
      <p className="font-medium tabular-nums"><Currency value={product.unit_price} /></p>
    </div>

    {/* Stops menu clicks — including portaled items — from opening the drawer. */}
    <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
      <ProductRowActions product={product} onEdit={onEdit} onDelete={onDelete} />
    </div>
  </li>
));

export default ProductRow;
