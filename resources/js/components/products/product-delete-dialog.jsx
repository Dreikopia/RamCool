import { router } from '@inertiajs/react';
import { useState } from 'react';
import { TriangleAlert } from 'lucide-react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogMedia,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';

/**
 * Delete confirmation for a product.
 *
 * - Sold products and products with any stock history are blocked with the reason.
 * - Otherwise asks for confirmation, then sends the DELETE request.
 */
const ProductDeleteDialog = ({ product, onOpenChange }) => {
    const [processing, setProcessing] = useState(false);

    const salesCount = product?.sale_items_count ?? 0;
    const hasSales = salesCount > 0;
    const hasStock = product?.inventory != null;
    const blocked = hasSales || hasStock;

    const confirmDelete = () => {
        if (processing) {
            return;
        }

        setProcessing(true);

        router.delete(`/products/${product.id}`, {
            only: ['products'],
            preserveScroll: true,
            onFinish: () => {
                setProcessing(false);
                onOpenChange(false);
            },
        });
    };

    return (
        <AlertDialog open={Boolean(product)} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    {blocked ? (
                        <>
                            <AlertDialogMedia>
                                <TriangleAlert className="text-destructive" />
                            </AlertDialogMedia>
                            <AlertDialogTitle>Cannot Delete Product</AlertDialogTitle>
                            <AlertDialogDescription>
                                {hasSales
                                    ? `This product appears in ${salesCount} ${salesCount === 1 ? 'sale' : 'sales'}. Mark it inactive instead of deleting it.`
                                    : `This product has stock history (${product?.in_stock ?? 0} on hand). Mark it inactive instead of deleting it.`}
                            </AlertDialogDescription>
                        </>
                    ) : (
                        <>
                            <AlertDialogTitle>Delete Product?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Are you sure you want to delete this product? This action cannot be
                                undone.
                            </AlertDialogDescription>
                        </>
                    )}
                </AlertDialogHeader>

                <AlertDialogFooter>
                    {blocked ? (
                        <AlertDialogAction onClick={() => onOpenChange(false)}>
                            OK
                        </AlertDialogAction>
                    ) : (
                        <>
                            <AlertDialogCancel disabled={processing}>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                                disabled={processing}
                                onClick={confirmDelete}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90 hover:text-destructive-foreground"
                            >
                                {processing ? 'Deleting…' : 'Delete'}
                            </AlertDialogAction>
                        </>
                    )}
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
};

export default ProductDeleteDialog;
