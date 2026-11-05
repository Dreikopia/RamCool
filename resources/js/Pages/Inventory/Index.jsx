import { useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import AppLayout from '@/Layouts/AppLayout';
import StockFormDrawer from '@/components/Inventory/stock-form-drawer';
import ProductStatusBadge from '@/components/products/product-status-badge';
import StockStatusBadge from '@/components/products/status-badge';
import { Pen } from 'lucide-react';

const Index = ({ inventories }) => {
    const [selected, setSelected] = useState(null);
    const [open, setOpen] = useState(false);

    const openDrawer = useCallback((inventoryId, mode = 'in') => {
        setSelected({ inventoryId, mode });
        setOpen(true);
    }, []);

    return (
        <div className="space-y-4 px-6">
            <div className="rounded-md border bg-muted">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="text-left">Product</TableHead>
                            <TableHead className="text-center">Current stock</TableHead>
                            <TableHead className="text-center">Category</TableHead>
                            <TableHead className="text-center">Reorder at</TableHead>
                            <TableHead className="text-center">Status</TableHead>
                            <TableHead className="text-center">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>

                        {inventories.map(({ id, product, quantity }) => (
                            <TableRow key={id}>

                                <TableCell className="text-left">
                                    <div>{product.name}</div>
                                    <div className="text-xs text-muted-foreground">{product.sku}</div>
                                </TableCell>

                                <TableCell className="text-center font-bold tabular-nums">
                                    {quantity}
                                </TableCell>

                                <TableCell className="text-center">
                                    {product.category.name}
                                </TableCell>

                                <TableCell className="text-center">
                                    {product.reorder_level}
                                </TableCell>

                                <TableCell className="text-center">
                                    <div className="flex flex-wrap items-center justify-center gap-1">
                                        <ProductStatusBadge status={product.status} />
                                        <StockStatusBadge status={product.stock_status} />
                                    </div>
                                </TableCell>

                                <TableCell className="text-center">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        aria-label={`Update stock for ${product.name}`}
                                        title="Update stock"
                                        onClick={() => openDrawer(id, 'in')}
                                    >
                                        <Pen className="size-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}

                    </TableBody>
                </Table>
            </div>

            <StockFormDrawer
                open={open}
                onOpenChange={setOpen}
                inventory={
                    selected
                        ? inventories.find((inv) => inv.id === selected.inventoryId)
                        : null
                }
                initialMode={selected?.mode ?? 'in'}
            />
        </div>
    );
};

Index.layout = (page) => <AppLayout title="Inventory">{page}</AppLayout>;
export default Index;
