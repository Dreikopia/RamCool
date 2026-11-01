import { useMemo, useState } from 'react';
import { Link, useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Button } from '@/components/ui/button';
import ProductPicker from '@/components/sales/product-picker';
import CurrentSale from '@/components/sales/current-sale';
import { ArrowLeft } from 'lucide-react';

const stockOf = (product) => product?.inventory?.quantity ?? 0;

const Create = ({ products, productCount }) => {
    // Only the minimum is stored: [{ product_id, quantity }]. Everything else is calculated.
    const { data, setData, post, processing, errors } = useForm({
        items: [],
        remarks: '',
    });

    // The picker only receives the current search results, so a line added
    // earlier would lose its product once the results change. Keep the record
    // that was added; fresh results still win over the remembered copy.
    const [pickedProducts, setPickedProducts] = useState(() => new Map());

    const productsById = useMemo(() => {
        const map = new Map(pickedProducts);
        products.forEach((product) => map.set(product.id, product));

        return map;
    }, [products, pickedProducts]);

    // Derived on every render, so they can never go out of sync with `items`.
    const lines = data.items.map((item) => {
        const product = productsById.get(item.product_id);
        return {
            ...item,
            product,
            subtotal: Number(product.unit_price) * item.quantity,
        };
    });
    const total = lines.reduce((sum, line) => sum + line.subtotal, 0);

    const quantityOf = (productId) =>
        data.items.find((item) => item.product_id === productId)?.quantity ?? 0;

    const changeQuantity = (productId, quantity) => {
        const stock = stockOf(productsById.get(productId));
        const safe = Math.min(Math.max(quantity, 1), stock); // keep between 1 and stock

        setData(
            'items',
            data.items.map((item) =>
                item.product_id === productId ? { ...item, quantity: safe } : item,
            ),
        );
    };

    const addItem = (product) => {
        const inSale = quantityOf(product.id);

        if (inSale >= stockOf(product)) {
            return;
        }

        setPickedProducts((current) => new Map(current).set(product.id, product));

        if (inSale === 0) {
            setData('items', [...data.items, { product_id: product.id, quantity: 1 }]);
        } else {
            // Same product again: raise its quantity. The backend's `distinct`
            // rule rejects two lines for one product.
            changeQuantity(product.id, inSale + 1);
        }
    };

    const removeItem = (productId) =>
        setData('items', data.items.filter((item) => item.product_id !== productId));

    const submit = (e) => {
        e.preventDefault();
        post('/sales'); // sends { items: [{ product_id, quantity }], remarks }
    };

    return (
        <form onSubmit={submit} className="space-y-4">
            <div>
                <Button variant="ghost" render={<Link href="/sales" />}>
                    <ArrowLeft />
                    Back to sales
                </Button>
            </div>

            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_380px]">
                <ProductPicker
                    products={products}
                    productCount={productCount}
                    quantityOf={quantityOf}
                    onAdd={addItem}
                />

                <CurrentSale
                    lines={lines}
                    total={total}
                    remarks={data.remarks}
                    onRemarksChange={(value) => setData('remarks', value)}
                    errors={errors}
                    processing={processing}
                    onChange={changeQuantity}
                    onRemove={removeItem}
                />
            </div>
        </form >
    );
};

Create.layout = (page) => <AppLayout>{page}</AppLayout>;

export default Create;