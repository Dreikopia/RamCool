<?php

namespace App\Models;

use App\Enums\StockStatus;
use Database\Factories\ProductFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Storage;

class Product extends Model
{
    /** @use HasFactory<ProductFactory> */
    use HasFactory;

    use SoftDeletes;

    /**
     * Attributes that are computed rather than stored on the table.
     *
     * @var list<string>
     */
    protected $appends = ['stock_status', 'image_url'];

    protected $fillable = [
        'name',
        'image_path',
        'sku',
        'category_id',
        'supplier_id',
        'unit_price',
        'reorder_level',
    ];

    protected function imageUrl(): Attribute
    {
        return Attribute::get(fn (): ?string => $this->image_path
            ? Storage::disk('public')->url($this->image_path)
            : null);
    }

    protected function stockStatus(): Attribute
    {
        return Attribute::get(function (): array {

            $quantity = $this->inventory?->quantity ?? 0;

            $status = StockStatus::fromStockLevels($quantity, $this->reorder_level);

            return ['value' => $status->value, 'label' => $status->label()];
        });
    }

    /**
     * Narrow the query to products whose name or SKU contains the search term.
     *
     * The `orWhere` is wrapped in a closure so it can never escape and
     * override another constraint such as a soft-delete or category filter.
     *
     * @param  Builder<Product>  $query
     * @return Builder<Product>
     */
    public function scopeSearch(Builder $query, ?string $term): Builder
    {
        $term = trim((string) $term);

        if ($term === '') {
            return $query;
        }

        return $query->where(function (Builder $query) use ($term): void {
            $query->where('name', 'like', "%{$term}%")
                ->orWhere('sku', 'like', "%{$term}%");
        });
    }

    public function saleItems()
    {
        return $this->hasMany(SaleItem::class);
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function supplier()
    {
        return $this->belongsTo(Supplier::class);
    }

    public function inventory()
    {
        return $this->hasOne(Inventory::class);
    }
}
