<?php

namespace App\Models;

use App\Enums\MovementType;
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

    public function scopeSearch(Builder $query, ?string $term): Builder
    {
        $term = trim((string) $term);

        if ($term === '') {
            return $query;
        }

        $like = '%'.addcslashes($term, '%_\\').'%';

        return $query->where(function (Builder $query) use ($like) {
            $query->where('remarks', 'like', $like)
                ->orWhereHas('inventory.product', function (Builder $product) use ($like) {
                    $product->where(function (Builder $product) use ($like) {
                        $product->where('name', 'like', $like)
                            ->orWhere('sku', 'like', $like);
                    });
                })
                ->orWhereHas('sale', function (Builder $sale) use ($like) {
                    $sale->where('sales_number', 'like', $like);
                });
        });
    }
}
