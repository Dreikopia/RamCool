import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Currency from '@/components/ui/currency';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import CartLine from './cartline';

const CurrentSale = ({
    lines,
    total,
    remarks,
    onRemarksChange,
    errors,
    processing,
    onChange,
    onRemove,
}) => {
    // Laravel names item errors "items" or "items.0.quantity"; show whichever exists.
    const itemError =
        errors.items ??
        Object.entries(errors).find(([key]) => key.startsWith('items.'))?.[1];

    const count = lines.reduce((sum, line) => sum + line.quantity, 0);

    return (
        <Card className="lg:sticky lg:top-4 lg:self-start">
            <CardHeader>
                <CardTitle>Current sale</CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
                {lines.length === 0 ? (
                    <p className="py-6 text-center text-sm text-muted-foreground">
                        No items yet. Search for a product and press Add.
                    </p>
                ) : (
                    <ul className="max-h-[40vh] divide-y overflow-y-auto">
                        {lines.map((line) => (
                            <CartLine
                                key={line.product_id}
                                line={line}
                                onChange={onChange}
                                onRemove={onRemove}
                            />
                        ))}
                    </ul>
                )}

                <div className="grid gap-1.5">
                    <Label htmlFor="remarks">Remarks (optional)</Label>
                    <Textarea
                        id="remarks"
                        rows={2}
                        maxLength={255}
                        value={remarks}
                        onChange={(e) => onRemarksChange(e.target.value)}
                    />
                    {errors.remarks && (
                        <p className="text-xs text-destructive">{errors.remarks}</p>
                    )}
                </div>

                {itemError && (
                    <p
                        role="alert"
                        className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
                    >
                        {itemError}
                    </p>
                )}

                <div className="flex items-baseline justify-between border-t pt-4">
                    <span className="text-sm text-muted-foreground">
                        Total · {count} {count === 1 ? 'item' : 'items'}
                    </span>
                    <Currency value={total} className="text-2xl font-bold" />
                </div>

                <Button
                    type="submit"
                    size="lg"
                    className="w-full"
                    disabled={lines.length === 0 || processing}
                >
                    {processing ? 'Completing…' : 'Complete sale'}
                </Button>
            </CardContent>
        </Card>
    );
};

export default CurrentSale;