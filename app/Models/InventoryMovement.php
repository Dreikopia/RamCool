<?php

namespace App\Models;

use App\Enums\MovementType;
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
}
