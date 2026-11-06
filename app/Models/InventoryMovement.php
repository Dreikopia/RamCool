<?php

namespace App\Models;

use App\Enums\MovementType;
use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

class InventoryMovement extends Model
{
    protected $fillable = [
        'inventory_id',
        'sale_id',
        'user_id',
        'type',
        'quantity',
        'remarks',
    ];

    protected $casts = [
        'type' => MovementType::class,
    ];

    public function sale()
    {
        return $this->belongsTo(Sale::class);
    }

    public function inventory()
    {
        return $this->belongsTo(Inventory::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Derive a human-friendly direction from the movement type.
     */
    public function getDirectionAttribute(): string
    {
        return match ($this->type) {
            MovementType::STOCK_OUT => 'outbound',
            MovementType::STOCK_IN => 'inbound',
            MovementType::ADJUSTMENT => $this->quantity < 0 ? 'outbound' : 'inbound',
        };
    }

    public function scopeOfType(Builder $query, ?MovementType $type): Builder
    {
        return $query->when($type, fn (Builder $query) => $query->where('type', $type));
    }

    public function scopeSearch(Builder $query, ?string $term): Builder
    {
        $term = trim((string) $term);

        if ($term === '') {
            return $query;
        }

        $like = '%'.addcslashes($term, '%_\\').'%';

        return $query->where(function (Builder $query) use ($like): void {
            $query->where('remarks', 'like', $like)
                ->orWhereHas('inventory.product', function (Builder $product) use ($like): void {
                    $product->where(function (Builder $product) use ($like): void {
                        $product->where('name', 'like', $like)
                            ->orWhere('sku', 'like', $like);
                    });
                });
        });
    }

    /**
     * @param  array<int, int>  $productIds
     */
    public function scopeForProducts(Builder $query, array $productIds = []): Builder
    {
        return $query->when(
            $productIds !== [],
            fn (Builder $query) => $query->whereHas(
                'inventory',
                fn (Builder $query) => $query->whereIn('product_id', $productIds),
            ),
        );
    }

    /**
     * @param  array<int, int>  $userIds
     */
    public function scopeByUsers(Builder $query, array $userIds = []): Builder
    {
        return $query->when(
            $userIds !== [],
            fn (Builder $query) => $query->whereIn('user_id', $userIds),
        );
    }

    public function scopeCreatedBetween(Builder $query, ?CarbonInterface $from, ?CarbonInterface $to): Builder
    {
        return $query
            ->when($from, fn (Builder $query) => $query->where('created_at', '>=', $from))
            ->when($to, fn (Builder $query) => $query->where('created_at', '<=', $to));
    }
}
