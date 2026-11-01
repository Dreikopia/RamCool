import { Minus, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Currency from '@/components/ui/currency';
import { Input } from '@/components/ui/input';

const CartLine = ({ line, onChange, onRemove }) => {
    const { product, quantity, subtotal } = line;
    const stock = product.inventory?.quantity ?? 0;

    return (
        <li className="flex items-start gap-3 py-3">
            <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{product.name}</p>
                <p className="text-xs text-muted-foreground">
                    <Currency value={product.unit_price} /> each
                </p>

                <div className="mt-2 flex items-center gap-1">
                    <Button
                        type="button"
                        variant="outline"
                        size="icon-sm"
                        disabled={quantity <= 1}
                        onClick={() => onChange(product.id, quantity - 1)}
                        aria-label={`Decrease ${product.name}`}
                    >
                        <Minus />
                    </Button>

                    <Input
                        type="number"
                        inputMode="numeric"
                        min={1}
                        max={stock}
                        value={quantity}
                        onChange={(e) => onChange(product.id, Number(e.target.value) || 1)}
                        aria-label={`Quantity of ${product.name}`}
                        className="h-7 w-14 text-center tabular-nums"
                    />

                    <Button
                        type="button"
                        variant="outline"
                        size="icon-sm"
                        disabled={quantity >= stock}
                        onClick={() => onChange(product.id, quantity + 1)}
                        aria-label={`Increase ${product.name}`}
                    >
                        <Plus />
                    </Button>
                </div>
            </div>

            <div className="flex flex-col items-end gap-1">
                <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => onRemove(product.id)}
                    aria-label={`Remove ${product.name}`}
                >
                    <X />
                </Button>
                <Currency value={subtotal} className="text-sm font-medium" />
            </div>
        </li>
    );
};

export default CartLine;