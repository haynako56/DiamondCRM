<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->string('address')->nullable()->after('shipping');
            $table->string('product_name')->nullable()->after('address');
            $table->enum('production_category', [
                'cad_casting',
                'handmade',
                'supplier_product',
                'custom',
            ])->default('cad_casting')->after('product_name');
            $table->string('dg_order_code')->nullable()->unique()->after('production_category');
            $table->date('order_due_date')->nullable()->after('dg_order_code');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn([
                'address',
                'product_name',
                'production_category',
                'dg_order_code',
                'order_due_date',
            ]);
        });
    }
};
