import { Badge } from '@/components/ui/badge';
import { cn } from 'cn';

// Single source of truth for product-status pills. Keyed by the enum value
// (App\Enums\ProductStatus), which the model serializes as a plain string.
const STYLES = {
    active: 'border-transparent bg-sky-500/15 text-sky-700 dark:text-sky-400',
    inactive: 'border-transparent bg-muted text-muted-foreground',
};

const LABELS = {
    active: 'Active',
    inactive: 'Inactive',
};

const valueOf = (status) =>
    typeof status === 'string' ? status : (status?.value ?? null);

const ProductStatusBadge = ({ status, className }) => {
    const value = valueOf(status);

    if (!value || !STYLES[value]) {
        return null;
    }

    return (
        <Badge variant="outline" className={cn(STYLES[value], className)}>
            {LABELS[value]}
        </Badge>
    );
};

export default ProductStatusBadge;
