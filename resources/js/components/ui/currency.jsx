import { cn } from 'cn';

const formatter = new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
});

export const formatCurrency = (value) => formatter.format(Number(value ?? 0));

const Currency = ({ value, className, ...props }) => (
    <span className={cn('tabular-nums', className)} {...props}>
        {formatCurrency(value)}
    </span>
);

export default Currency;