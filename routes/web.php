<?php

use Illuminate\Support\Facades\Route;
use Laravel\Fortify\Features;
use App\Http\Controllers\OrderTaskController;
use App\Http\Controllers\JobsController;
use App\Http\Controllers\SettingsController;


Route::inertia('/', 'welcome', [
    'canRegister' => Features::enabled(Features::registration()),
])->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::inertia('dashboard', 'dashboard')->name('dashboard');

    // Jobs management
    Route::get('/jobs', [App\Http\Controllers\JobsController::class, 'index'])->name('jobs.index');
    Route::get('/jobs/due-dates', [App\Http\Controllers\JobsController::class, 'due'])->name('jobs.due');
    Route::get('/jobs/reports', [App\Http\Controllers\JobsController::class, 'reports'])->name('jobs.reports');

    Route::prefix('orders/{order}/tasks')->group(function () {
        Route::post('/',         [OrderTaskController::class, 'store'])->name('orders.tasks.store');
        Route::patch('/{task}',  [OrderTaskController::class, 'update'])->name('orders.tasks.update');
        Route::delete('/{task}', [OrderTaskController::class, 'destroy'])->name('orders.tasks.destroy');
    });

    Route::post('/orders',               [JobsController::class, 'store'])->name('jobs.store');
    Route::patch('/orders/{order}',      [JobsController::class, 'update'])->name('jobs.update');
    Route::patch('/orders/{order}/production-category', [JobsController::class, 'updateProductionCategory']);

    Route::get('/jobs/settings',              [SettingsController::class, 'index'])->name('jobs.settings');
    Route::post('/jobs/settings/woocommerce',      [SettingsController::class, 'saveWooCommerce'])->name('settings.woocommerce.save');
    Route::post('/jobs/settings/woocommerce/test', [SettingsController::class, 'testConnection'])->name('settings.woocommerce.test');
    Route::post('/jobs/settings/team',             [SettingsController::class, 'saveTeam'])->name('settings.team.save');

    Route::post('/jobs/sync', [JobsController::class, 'sync'])->name('jobs.sync');


});

require __DIR__.'/settings.php';
