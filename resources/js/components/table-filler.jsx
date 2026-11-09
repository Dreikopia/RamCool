import { cn } from 'cn';
import { TableCell, TableRow } from '@/components/ui/table';

/**
 * Empty rows that keep the table body at the paginated height when the current
 * page has fewer than a full set of results.
 */
export function TableFiller({ rows = 0, cols = 1, className }) {
    if (rows <= 0) {
        return null;
    }

    return Array.from({ length: rows }, (_, rowIndex) => (
        <TableRow
            key={`filler-${rowIndex}`}
            aria-hidden="true"
            className={cn('hover:bg-transparent', className)}
        >
            {Array.from({ length: cols }, (_, colIndex) => (
                <TableCell key={colIndex} className="h-9 px-4 py-2" />
            ))}
        </TableRow>
    ));
}

export default TableFiller;
