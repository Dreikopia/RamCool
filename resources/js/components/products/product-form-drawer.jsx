import { useForm } from '@inertiajs/react';
import { useEffect, useLayoutEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import ProductThumbnail from './product-thumbnail';
import { ProductImageUpload } from './product-image-upload';
import { ProductImageLightbox } from './product-image-lightbox';

const Field = ({ label, htmlFor, error, className = '', children }) => (
    <div className={`grid gap-1.5 ${className}`}>
        <Label htmlFor={htmlFor}>{label}</Label>
        {children}
        {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
);

const emptyForm = () => ({
    name: '',
    sku: '',
    status: 'active',
    category_id: '',
    supplier_id: '',
    unit_price: '',
    reorder_level: '',
    image: null,
    remove_image: false,
});

const formFor = (product) => ({
    name: product.name ?? '',
    sku: product.sku ?? '',
    status: product.status ?? 'active',
    category_id: product.category_id ? String(product.category_id) : '',
    supplier_id: product.supplier_id ? String(product.supplier_id) : '',
    unit_price: product.unit_price ?? '',
    reorder_level: product.reorder_level ?? '',
    image: null,
    remove_image: false,
});

const ProductFormDrawer = ({ open, onOpenChange, product, categories, suppliers }) => {
    const isEdit = Boolean(product);

    const { data, setData, post, put, processing, errors, recentlySuccessful } =
        useForm(emptyForm());

    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [lightboxSrc, setLightboxSrc] = useState(undefined);

    useLayoutEffect(() => {
        setData(product ? formFor(product) : emptyForm());
    }, [open, product]);

    useEffect(() => {
        if (recentlySuccessful) {
            onOpenChange(false);
        }
    }, [recentlySuccessful]);

    const submit = (e) => {
        e.preventDefault();

        if (isEdit) {
            put(`/products/${product.id}`, { forceFormData: true });
        } else {
            post('/products', { forceFormData: true });
        }
    };

    const supplierLabels = Object.fromEntries(
        suppliers.map((supplier) => [String(supplier.id), supplier.name]),
    );
    const categoryLabels = Object.fromEntries(
        categories.map((category) => [String(category.id), category.name]),
    );
    const statusLabels = {
        active: 'Active',
        inactive: 'Inactive',
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent
                side="right"
                className="gap-0 data-[side=right]:w-[85vw] data-[side=right]:sm:w-[400px] data-[side=right]:md:w-[500px] data-[side=right]:lg:w-[600px] data-[side=right]:sm:max-w-none"
            >
                <SheetHeader className="shrink-0 border-b">
                    <div className="pr-10">
                        <SheetTitle>{isEdit ? 'Edit product' : 'New product'}</SheetTitle>
                        <SheetDescription className="mt-1">
                            {isEdit
                                ? 'Update this product’s details.'
                                : 'Add a product to your inventory.'}
                        </SheetDescription>
                    </div>

                    {isEdit && (
                        <div className="mt-3 flex items-center gap-3 rounded-xl border border-sidebar-border bg-muted/40 p-2.5">
                            <ProductThumbnail product={product} />

                            <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium">{product.name}</p>
                                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                                    {product.sku}
                                    {product.category?.name ? ` · ${product.category.name}` : ''}
                                </p>
                            </div>
                        </div>
                    )}
                </SheetHeader>


                <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
                    <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">

                        <Field
                            label="Product image"
                            htmlFor="product-image"
                            error={errors.image}
                        >
                            <ProductImageUpload
                                id="product-image"
                                value={data.image}
                                onValueChange={(file) => {
                                    setData('image', file);
                                    setData('remove_image', false);
                                }}
                                src={
                                    isEdit &&
                                        product.image_url &&
                                        !data.image &&
                                        !data.remove_image
                                        ? product.image_url
                                        : undefined
                                }
                                onRemove={() => {
                                    setData('image', null);
                                    setData('remove_image', true);
                                }}
                                onView={(src) => {
                                    setLightboxSrc(src);
                                    setLightboxOpen(true);
                                }}
                                disabled={processing}
                            />
                        </Field>
                        <div className="grid gap-3 mt-2">
                            <Field label="Product name" htmlFor="name" error={errors.name}>
                                <Input
                                    id="name"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    placeholder="Air Conditioner"
                                    aria-invalid={Boolean(errors.name)}
                                    disabled={processing}
                                />
                            </Field>

                            <Field label="SKU" htmlFor="sku" error={errors.sku}>
                                <Input
                                    id="sku"
                                    value={data.sku}
                                    onChange={(e) => setData('sku', e.target.value)}
                                    placeholder="AIR-CON"
                                    aria-invalid={Boolean(errors.sku)}
                                    disabled={processing}
                                />
                            </Field>



                            <div className="grid grid-cols-2 gap-3">
                                <Field label="Category" htmlFor="category" error={errors.category_id}>
                                    <Select
                                        value={data.category_id}
                                        onValueChange={(value) =>
                                            setData('category_id', value === null ? '' : String(value))
                                        }
                                        items={categoryLabels}
                                    >
                                        <SelectTrigger
                                            id="category"
                                            className="w-full"
                                            aria-invalid={Boolean(errors.category_id)}
                                        >
                                            <SelectValue placeholder="Select a category" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {categories.map((category) => (
                                                <SelectItem key={category.id} value={String(category.id)}>
                                                    {category.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </Field>

                                <Field label="Supplier" htmlFor="supplier" error={errors.supplier_id}>

                                    <Select
                                        value={data.supplier_id || null}
                                        onValueChange={(value) => setData('supplier_id', value == null ? '' : String(value))}
                                        items={supplierLabels}
                                    >

                                        <SelectTrigger
                                            id="supplier_id"
                                            className="w-full"
                                            aria-invalid={Boolean(errors.supplier_id)}
                                        >
                                            <SelectValue placeholder="Select a supplier" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {suppliers.map((supplier) => (
                                                <SelectItem key={supplier.id}
                                                    value={String(supplier.id)}
                                                >
                                                    {supplier.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </Field>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mt-2">
                                <Field label="Unit price" htmlFor="unit_price" error={errors.unit_price}>
                                    <Input
                                        id="unit_price"
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={data.unit_price}
                                        onChange={(e) => setData('unit_price', e.target.value)}
                                        placeholder="89.99"
                                        aria-invalid={Boolean(errors.unit_price)}
                                        disabled={processing}
                                    />
                                </Field>
                                <Field
                                    label="Reorder level"
                                    htmlFor="reorder_level"
                                    error={errors.reorder_level}
                                >
                                    <Input
                                        id="reorder_level"
                                        type="number"
                                        min="0"
                                        step="1"
                                        value={data.reorder_level}
                                        onChange={(e) => setData('reorder_level', e.target.value)}
                                        placeholder="Minimum stock before reorder"
                                        aria-invalid={Boolean(errors.reorder_level)}
                                        disabled={processing}
                                    />
                                </Field>

                            </div>

                            <Field label="Status" htmlFor="status" error={errors.status}>
                                <Select
                                    value={data.status}
                                    onValueChange={(value) =>
                                        setData('status', value == null ? 'active' : String(value))
                                    }
                                    items={statusLabels}
                                >
                                    <SelectTrigger
                                        id="status"
                                        className="w-full"
                                        aria-invalid={Boolean(errors.status)}
                                    >
                                        <SelectValue placeholder="Select a status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="active">Active</SelectItem>
                                        <SelectItem value="inactive">Inactive</SelectItem>
                                    </SelectContent>
                                </Select>
                                <p className="text-xs text-muted-foreground">
                                    Inactive products cannot be sold in new transactions.
                                    Existing stock is still tracked.
                                </p>
                            </Field>
                        </div>
                    </div>

                    <SheetFooter className="shrink-0 border-t sm:flex-row sm:justify-end">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={processing}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {isEdit
                                ? processing
                                    ? 'Saving…'
                                    : 'Save changes'
                                : processing
                                    ? 'Creating…'
                                    : 'Create product'}
                        </Button>
                    </SheetFooter>
                </form>
                <ProductImageLightbox
                    open={lightboxOpen}
                    onOpenChange={setLightboxOpen}
                    src={lightboxSrc}
                    alt="Product Image"
                />
            </SheetContent >
        </Sheet >
    );
};

export default ProductFormDrawer;
