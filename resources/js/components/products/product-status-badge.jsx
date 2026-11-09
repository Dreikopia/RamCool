import { StatusIndicator } from '@/components/ui/status-indicator';

// Single source of truth for product-status indicators. Keyed by the enum value
// (App\Enums\ProductStatus), which the model serializes as a plain string.
const TONES = {
    active: 'success',
    inactive: 'muted',
};

const LABELS = {
    active: 'Active',
    inactive: 'Inactive',
};

const valueOf = (status) =>
    typeof status === 'string' ? status : (status?.value ?? null);

const ProductStatusBadge = ({ status, className }) => {
    const value = valueOf(status);

    if (!value || !TONES[value]) {
        return null;
    }

    return (
        <StatusIndicator tone={TONES[value]} label={LABELS[value]} className={className} />
    );
};

export default ProductStatusBadge;
