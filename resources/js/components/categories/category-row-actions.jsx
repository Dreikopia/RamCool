import { Ellipsis, Pencil, Trash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const CategoryRowActions = ({ category, onEdit, onDelete }) => {
    return (
        <DropdownMenu>

            <DropdownMenuTrigger
                aria-label={`Actions for ${category.name}`}
                render={<Button variant="ghost" size="icon" />}
            >
                <Ellipsis />
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(category)}>
                    <Pencil />
                    Edit
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem variant="destructive" onClick={() => onDelete(category)}>
                    <Trash />
                    Delete
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

export default CategoryRowActions;
