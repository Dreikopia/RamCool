<?php

use App\Http\Controllers\ActivateAccountController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\InventoryController;
use App\Http\Controllers\InventoryMovementController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\SaleController;
use App\Http\Controllers\SupplierController;
use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;

Route::middleware('signed')->group(function () {
    Route::get('/activate/{user}', [ActivateAccountController::class, 'show'])
        ->name('account.activate.show');
    Route::post('/activate/{user}', [ActivateAccountController::class, 'store'])
        ->name('account.activate.store');
});

Route::middleware(['auth', 'active'])->group(function () {
    Route::get('/', [DashboardController::class, 'index'])->name('dashboard');

    Route::get('/products', [ProductController::class, 'index'])->name('products');
    Route::post('/products', [ProductController::class, 'store'])->name('products.store');
    Route::put('/products/{product}', [ProductController::class, 'update'])->name('products.update');

    Route::get('/categories', [CategoryController::class, 'index'])->name('categories');
    Route::post('/categories', [CategoryController::class, 'store'])->name('category.store');
    Route::patch('/categories/{category}', [CategoryController::class, 'update'])->name('category.update');
    Route::delete('/categories/{category}', [CategoryController::class, 'destroy'])->name('category.destroy');

    Route::get('/suppliers', [SupplierController::class, 'index'])->name('suppliers');
    Route::post('/suppliers', [SupplierController::class, 'store'])->name('suppliers.store');
    Route::patch('/suppliers/{supplier}', [SupplierController::class, 'update'])->name('suppliers.update');

    Route::get('/inventories', [InventoryController::class, 'index'])->name('inventories');

    Route::post('/inventories/{inventory}/stock-in', [InventoryMovementController::class, 'stockIn'])->name('stock-in');
    Route::post('/inventories/{inventory}/stock-out', [InventoryMovementController::class, 'stockOut'])->name('stock-out');
    Route::post('/inventories/{inventory}/adjustment', [InventoryMovementController::class, 'adjustment'])->name('adjustment');

    Route::get('/movements', [InventoryMovementController::class, 'index'])->name('movements.index');

    Route::get('/sales', [SaleController::class, 'index'])->name('sales');
    Route::get('/sales/create', [SaleController::class, 'create'])->name('sales.create');
    Route::post('/sales', [SaleController::class, 'store'])->name('sales.store');
    Route::patch('/sales/{sale}/void', [SaleController::class, 'void'])->name('sales.void');

    Route::middleware('admin')->group(function () {
        Route::get('/users', [UserController::class, 'index'])->name('users');
        Route::post('/users', [UserController::class, 'store'])->name('users.store');
        Route::patch('/users/{user}', [UserController::class, 'update'])->name('users.update');
    });
});
