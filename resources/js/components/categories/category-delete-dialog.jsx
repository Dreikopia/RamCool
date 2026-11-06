import { router } from '@inertiajs/react';
import { useState } from 'react';
import { TriangleAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
 * Delete confirmation for a category.
 *
 * - Category with products: explains why deletion is blocked (PRD §3.4).
 * - Empty category: asks for confirmation, then sends the DELETE request.
 *
 * `onOpenChange` is driven by the parent, which tracks the selected category,
 * so closing simply clears the selection.
 */
const CategoryDeleteDialog = ({ category, onOpenChange }) => {
    const [processing, setProcessing] = useState(false);

    const hasProducts = (category?.products_count ?? 0) > 0;

    const confirmDelete = () => {
        if (processing) {
            return;
        }

        setProcessing(true);

        router.delete(`/categories/${category.id}`, {
            onFinish: () => {
                setProcessing(false);
                onOpenChange(false);
            },
        });
    };

    return (
        <AlertDialog open={Boolean(category)} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    {hasProducts ? (
                        <>
                            <AlertDialogMedia>
                                <TriangleAlert className="text-destructive" />
                            </AlertDialogMedia>
                            <AlertDialogTitle>Cannot Delete Category</AlertDialogTitle>
                            <AlertDialogDescription>
                                This category currently has {category?.products_count}{' '}
                                {category?.products_count === 1 ? 'product' : 'products'} assigned to it.
                                Please reassign or remove the associated products before deleting this
                                category.
                            </AlertDialogDescription>
                        </>
                    ) : (
                        <>
                            <AlertDialogTitle>Delete Category?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Are you sure you want to delete this category? This action cannot be
                                undone.
                            </AlertDialogDescription>
                        </>
                    )}
                </AlertDialogHeader>

                <AlertDialogFooter>
                    {hasProducts ? (
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

export default CategoryDeleteDialog;
