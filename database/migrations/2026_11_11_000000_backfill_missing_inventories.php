<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Give products created before inventory rows were automatic a row to stock.
     */
    public function up(): void
    {
        DB::insert(
            'insert into inventories (product_id, quantity, created_at, updated_at)
             select products.id, 0, ?, ? from products
             where products.deleted_at is null
             and not exists (select 1 from inventories where inventories.product_id = products.id)',
            [now(), now()],
        );
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Backfilled rows are indistinguishable from real ones; leave them.
    }
};
