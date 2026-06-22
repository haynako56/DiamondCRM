<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement("ALTER TABLE orders MODIFY COLUMN production_category ENUM('cad_casting','handmade','supplier_product','ring_resize','jewellery_repair','custom') DEFAULT 'cad_casting'");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE orders MODIFY COLUMN production_category ENUM('cad_casting','handmade','supplier_product','custom') DEFAULT 'cad_casting'");
    }
};
