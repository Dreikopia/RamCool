import { StatusIndicator } from '@/components/ui/status-indicator';

// Single source of truth for sale-status indicators. Keyed by the enum value
// (App\Enums\SaleStatus), which the model serializes as a plain string.
const TONES = {
    completed: 'success',
    voided: 'danger',
};

const LABELS = {
    completed: 'Completed',
    voided: 'Voided',
};

const SaleStatusBadge = ({ status, className }) => {
    const value = typeof status === 'string' ? status : (status?.value ?? null);

    if (!value || !TONES[value]) {
        return null;
    }

    return (
        <StatusIndicator tone={TONES[value]} label={LABELS[value]} className={className} />
    );
};

export default SaleStatusBadge;
