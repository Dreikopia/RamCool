import { useCallback, useState } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import ProductFormDrawer from '@/components/products/product-form-drawer';
import { Button } from '@/components/ui/button';
import ProductRow from '@/components/products/product-row';

const Index = ({ products, categories, suppliers }) => {
  const [drawer, setDrawer] = useState({ open: false, product: null });

  const openCreate = useCallback(() => setDrawer({ open: true, product: null }), []);
  const openEdit = useCallback((product) => setDrawer({ open: true, product }), []);

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={openCreate} variant="secondary">
          New product
        </Button>
      </div>

      <div className="rounded-xl border border-sidebar-border bg-card">
        {products.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-muted-foreground">No products yet.</p>
            <Button className="mt-4" variant="outline" onClick={openCreate}>
              Add your first product
            </Button>
          </div>
        ) : (
          <ul className="divide-y divide-sidebar-border">
            {products.map((product) => (
              <ProductRow key={product.id} product={product} onEdit={openEdit} />
            ))}
          </ul>
        )}
      </div>

      <ProductFormDrawer
        open={drawer.open}
        onOpenChange={(open) => setDrawer((current) => ({ ...current, open }))}
        product={drawer.product}
        categories={categories}
        suppliers={suppliers}
      />
    </>
  );
};

Index.layout = (page) => <AppLayout title="Products">{page}</AppLayout>;

export default Index;
