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
        Schema::create('order_tasks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained()->cascadeOnDelete();
            $table->string('method');        // cad_casting | handmade | supplier_product
            $table->integer('sort_order');   // controls display order
            $table->string('key');           // diamonds_order, cad_send, dispatch, etc.
            $table->string('label');         // "Diamonds - Order Placed"
            $table->text('description')->nullable();
            $table->boolean('is_done')->default(false);
            $table->boolean('is_custom')->default(false);   // true = user-added task
            $table->string('progress')->nullable();          // Not Started | In Progress | Quality check | Complete
            $table->string('tracking_ref')->nullable();      // dispatch tracking number
            $table->date('task_date')->nullable();           // order/approval/dispatch date
            $table->text('note')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('order_tasks');
    }
};
