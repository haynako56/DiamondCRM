<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // One finance record per order
        Schema::create('order_finances', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->unique()->constrained()->cascadeOnDelete();
            $table->boolean('costings_done')->default(false);
            $table->timestamps();
        });

        // The cost lines on a finance record: four defaults plus any custom ones
        Schema::create('order_finance_costs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_finance_id')->constrained()->cascadeOnDelete();
            $table->integer('sort_order');
            $table->string('key');                          // diamond | cad | casting | production | custom_*
            $table->string('label');                        // "Diamond purchase"
            $table->string('supplier')->nullable();
            $table->decimal('amount', 10, 2)->default(0);
            $table->string('note')->nullable();             // invoice ref, notes
            $table->boolean('is_saved')->default(false);    // locked after the user saves the row
            $table->boolean('is_custom')->default(false);   // true = user-added cost line
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('order_finance_costs');
        Schema::dropIfExists('order_finances');
    }
};
