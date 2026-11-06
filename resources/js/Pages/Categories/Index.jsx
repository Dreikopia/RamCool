import { useEffect, useState } from 'react';
import { router } from '@inertiajs/react';
import { Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/Layouts/AppLayout';
import CategoryFormModal from '@/components/categories/category-form-modal';
import CategoryRowActions from '@/components/categories/category-row-actions';
import CategoryDeleteDialog from '@/components/categories/category-delete-dialog';
import { useDebouncedValue } from '@/hooks/use-debounced-value';

const visit = (search) => {
    router.get(
        '/categories',
        { search: search || undefined },
        {
            only: ['categories', 'filters'],
            preserveState: true,
            preserveScroll: true,
            replace: true,
        },
    );
};

const Index = ({ categories, filters }) => {
    const [modal, setModal] = useState({ open: false, category: null });
    const [deleting, setDeleting] = useState(null);
    const [search, setSearch] = useState(filters.search ?? '');
    const debouncedSearch = useDebouncedValue(search.trim(), 300);

    useEffect(() => {
        if (debouncedSearch === (filters.search ?? '')) {
            return;
        }

        visit(debouncedSearch);
    }, [debouncedSearch]);

    const openCreate = () => setModal({ open: true, category: null });
    const openEdit = (category) => setModal({ open: true, category });

    return (
        <>
            <div className="flex flex-wrap items-center gap-3">
                <div className="relative w-full max-w-sm">
                    <Search className="absolute top-2.5 left-2.5 size-4 text-muted-foreground" />
                    <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search by name..."
                        className="pl-8"
                        aria-label="Search categories"
                    />
                </div>

                <Button onClick={openCreate} variant="secondary">
                    Add Category
                </Button>
            </div>

            <div className="rounded-md border bg-muted">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Category</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Products</TableHead>
                            <TableHead className='text-right'>
                                Actions
                            </TableHead>
                        </TableRow>
                    </TableHeader>

                    <TableBody>
                        {categories.length === 0 ? (
                            filters.search ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                                        No categories found for "{filters.search}".
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="ml-3"
                                            onClick={() => setSearch('')}
                                        >
                                            Clear search
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                                        No categories yet.
                                    </TableCell>
                                </TableRow>
                            )
                        ) : (
                            categories.map((category) => (
                                <TableRow key={category.id}>
                                    <TableCell className="font-medium">
                                        {category.name}
                                    </TableCell>
                                    <TableCell className="max-w-xs text-muted-foreground">
                                        {category.description ?? '—'}
                                    </TableCell>
                                    <TableCell>
                                        <Badge>
                                            {category.products_count} products
                                        </Badge>
                                    </TableCell>

                                    <TableCell className="text-right">
                                        <div className='flex justify-end'>
                                            <CategoryRowActions
                                                category={category}
                                                onEdit={openEdit}
                                                onDelete={setDeleting}
                                            />
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}

                    </TableBody>
                </Table>

            </div>

            <CategoryFormModal
                open={modal.open}
                onOpenChange={(open) => setModal((current) => ({ ...current, open }))}
                category={modal.category}
            />

            <CategoryDeleteDialog
                category={deleting}
                onOpenChange={(open) => {
                    if (!open) {
                        setDeleting(null);
                    }
                }}
            />
        </>
    );
}

Index.layout = (page) => <AppLayout title="Categories">{page}</AppLayout>;

export default Index;
