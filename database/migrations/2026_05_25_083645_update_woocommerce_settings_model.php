<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('woocommerce_settings', function (Blueprint $table) {
            $table->string('store_url')->nullable()->after('id');
            $table->string('production_email')->nullable()->after('secret');
            $table->string('admin_email')->nullable()->after('production_email');
            $table->string('default_turnaround')->default('4 weeks')->after('admin_email');
        });
    }

    public function down(): void
    {
        Schema::table('woocommerce_settings', function (Blueprint $table) {
            $table->dropColumn(['store_url', 'production_email', 'admin_email', 'default_turnaround']);
        });
    }
};