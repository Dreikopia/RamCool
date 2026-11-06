<?php

namespace App\Models;

use App\Enums\ProductStatus;
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

    protected $appends = ['stock_status', 'in_stock', 'image_url'];

    protected $fillable = [
        'name',
        'image_path',
        'sku',
        'status',
        'category_id',
        'supplier_id',
        'unit_price',
        'reorder_level',
    ];

    protected $casts = [
        'status' => ProductStatus::class,
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

    protected function inStock(): Attribute
    {
        return Attribute::get(fn (): int => $this->inventory?->quantity ?? 0);
    }

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

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('status', ProductStatus::ACTIVE->value);
    }

    public function scopeInactive(Builder $query): Builder
    {
        return $query->where('status', ProductStatus::INACTIVE->value);
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
