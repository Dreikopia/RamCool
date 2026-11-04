import SupplierDialog from "@/components/suppliers/supplier-dialog";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import AppLayout from "@/Layouts/AppLayout";
import { useState } from 'react'
import { router } from '@inertiajs/react'
const Index = ({ suppliers }) => {

    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedSupplier, setSelectedSupplier] = useState(null);

    const openCreate = () => {
        setSelectedSupplier(null);
        setDialogOpen(true);
    }

    const openEdit = (supplier) => {
        setSelectedSupplier(supplier);
        setDialogOpen(true);
    }


    return (
        <div className="p-6 space-y-4">
            <div>
                <Button onClick={openCreate}>Add Supplier</Button>
            </div>

            <div className="rounded-md border bg-muted">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Contact Person</TableHead>
                            <TableHead>Phone</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead className='text-right'>Actions</TableHead>
                        </TableRow>
                    </TableHeader>

                    <TableBody>
                        {suppliers.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={5}
                                    className="text-center text-muted-foreground"
                                >
                                    No supplier yet
                                </TableCell>
                            </TableRow>
                        ) : (
                            suppliers.map((supplier) => (
                                <TableRow key={supplier.id}>
                                    <TableCell className="font-medium">
                                        {supplier.name}
                                    </TableCell>
                                    <TableCell>
                                        {supplier.contact_person ?? '—'}
                                    </TableCell>
                                    <TableCell>
                                        {supplier.phone ?? '—'}
                                    </TableCell>
                                    <TableCell>
                                        {supplier.email ?? '—'}
                                    </TableCell>
                                    <TableCell className="text-right space-x-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => openEdit(supplier)}
                                        >
                                            Edit
                                        </Button>
                                        <Button size="sm">
                                            View
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
            <SupplierDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                supplier={selectedSupplier}
            />
        </div>

    );
}

Index.layout = (page) => <AppLayout title="Suppliers">{page}</AppLayout>;

export default Index;