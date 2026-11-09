import { StatusIndicator } from '@/components/ui/status-indicator';

// Status pill replaced by a dot + label. Keyed by the enum value
// (App\Enums\UserStatus), which the model serializes as { value, label }.
const TONES = {
    active: 'success',
    pending: 'warning',
    disabled: 'muted',
};

const LABELS = {
    active: 'Active',
    pending: 'Pending',
    disabled: 'Disabled',
};

const valueOf = (status) =>
    typeof status === 'string' ? status : (status?.value ?? null);

const UserStatusBadge = ({ status, className }) => {
    const value = valueOf(status);

    if (!value || !TONES[value]) {
        return null;
    }

    return (
        <StatusIndicator tone={TONES[value]} label={LABELS[value]} className={className} />
    );
};

export default UserStatusBadge;
