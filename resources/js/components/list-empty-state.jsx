import { Button } from '@/components/ui/button';

/**
 * Standard empty state used inside DataTableCard.
 */
export function ListEmptyState({ title, description, actionLabel, onAction, children }) {
    return (
        <div className="px-6 py-12 text-center">
            <p className="text-muted-foreground">{title}</p>

            {description && (
                <p className="mt-1 text-sm text-muted-foreground">{description}</p>
            )}

            {children}

            {actionLabel && onAction && (
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-4"
                    onClick={onAction}
                >
                    {actionLabel}
                </Button>
            )}
        </div>
    );
}

export default ListEmptyState;
