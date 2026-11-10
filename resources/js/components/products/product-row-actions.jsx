import { Ellipsis, Pencil, Power, Trash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const ProductRowActions = ({ product, onEdit, onDelete, onToggleStatus, disabled }) => {
    const status = typeof product.status === 'string' ? product.status : product.status?.value;

    return (
        <DropdownMenu>
            <DropdownMenuTrigger
                aria-label={`Actions for ${product.name}`}
                render={<Button variant="ghost" size="icon" />}
            >
                <Ellipsis />
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit?.(product)}>
                    <Pencil />
                    Edit
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                    disabled={disabled}
                    onClick={() => onToggleStatus?.(product)}
                >
                    <Power />
                    {status === 'active' ? 'Mark inactive' : 'Mark active'}
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem variant="destructive" onClick={() => onDelete?.(product)}>
                    <Trash />
                    Delete
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

export default ProductRowActions;