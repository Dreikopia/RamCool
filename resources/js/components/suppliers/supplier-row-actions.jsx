import { Ellipsis, Pencil, Power } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const SupplierRowActions = ({ supplier, disabled, onEdit, onToggleStatus }) => {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger
                aria-label={`Actions for ${supplier.name}`}
                render={<Button variant="ghost" size="icon" />}
            >
                <Ellipsis />
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(supplier)}>
                    <Pencil />
                    Edit
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                    disabled={disabled}
                    onClick={() => onToggleStatus(supplier)}
                >
                    <Power />
                    {supplier.is_active ? 'Deactivate' : 'Activate'}
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

export default SupplierRowActions;
