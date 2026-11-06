import { useCallback, useState, useEffect } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import ProductFormDrawer from '@/components/products/product-form-drawer';
import { Button } from '@/components/ui/button';
import ProductRow from '@/components/products/product-row';
import { Input } from '@/components/ui/input';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { router } from '@inertiajs/react';
import { cn } from 'cn';

const STATUS_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

const visit = ({ search, status }) => {
  router.get(
    window.location.pathname,
    {
      search: search || undefined,
      status: status === 'all' ? undefined : status,
    },
    {
      only: ['products', 'filters'],
      preserveState: true,
      preserveScroll: true,
      replace: true,
    },
  );
};

const Index = ({ products, categories, suppliers, filters }) => {
  const [drawer, setDrawer] = useState({ open: false, product: null });
  const [search, setSearch] = useState(filters.search ?? '');
  const debounceSearch = useDebouncedValue(search.trim(), 300);
  const currentStatus = filters.status ?? 'all';

  useEffect(() => {
    if (debounceSearch === filters.search ?? '') return;

    visit({ search: debounceSearch, status: currentStatus });

  }, [debounceSearch])

  const changeStatus = (status) => {
    if (status === currentStatus) return;

    visit({ search: search.trim(), status });
  };

  const openCreate = useCallback(() => setDrawer({ open: true, product: null }), []);
  const openEdit = useCallback((product) => setDrawer({ open: true, product }), []);

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or SKU..."
          className="max-w-sm"
        />

        <div
          role="group"
          aria-label="Filter by status"
          className="inline-flex rounded-full bg-muted p-1"
        >
          {STATUS_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => changeStatus(option.value)}
              aria-pressed={currentStatus === option.value}
              className={cn(
                'rounded-full px-3 py-1 text-sm transition-colors',
                currentStatus === option.value
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {option.label}
            </button>
          ))}
        </div>

        <Button onClick={openCreate} variant="secondary">
          New product
        </Button>
      </div>

      <div className="rounded-xl border border-sidebar-border bg-card">

        {products.length === 0 ? (
          filters.search ? (
            <div className="py-12 text-center">
              <p className="text-muted-foreground">
                No products found for "{filters.search}".
              </p>
              <Button
                className="mt-4"
                variant="outline"
                onClick={() => setSearch('')}
              >
                Clear search
              </Button>
            </div>
          ) :
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
