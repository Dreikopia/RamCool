import { Badge } from '@/components/ui/badge';
import { cn } from 'cn';


const STYLES = {
    active: 'border-transparent bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
    pending: 'border-transparent bg-amber-500/15 text-amber-700 dark:text-amber-400',
    disabled: 'border-transparent bg-muted text-muted-foreground',
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

    if (!value || !STYLES[value]) {
        return null;
    }

    return (
        <Badge variant="outline" className={cn(STYLES[value], className)}>
            {LABELS[value]}
        </Badge>
    );
};

export default UserStatusBadge;
