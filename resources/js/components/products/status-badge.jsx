import { StatusIndicator } from '@/components/ui/status-indicator';

// Single source of truth for stock-status indicators. Keyed by the enum value
// (App\Enums\StockStatus), which the Product model serializes as
// { value, label }. Labels are owned here so wording stays consistent.
const TONES = {
    in_stock: 'success',
    low_stock: 'warning',
    out_of_stock: 'danger',
};

const LABELS = {
    in_stock: 'In stock',
    low_stock: 'Low stock',
    out_of_stock: 'Out of stock',
};

const valueOf = (status) =>
    typeof status === 'string' ? status : (status?.value ?? null);

const StockStatusBadge = ({ status, className }) => {
    const value = valueOf(status);

    if (!value || !TONES[value]) {
        return null;
    }

    return (
        <StatusIndicator tone={TONES[value]} label={LABELS[value]} className={className} />
    );
};

export default StockStatusBadge;
