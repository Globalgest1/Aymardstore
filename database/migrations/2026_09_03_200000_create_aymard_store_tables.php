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
        // 1. Add extra user columns if not exist
        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'role')) {
                $table->string('role')->default('CUSTOMER');
            }
            if (!Schema::hasColumn('users', 'phone')) {
                $table->string('phone')->nullable();
            }
            if (!Schema::hasColumn('users', 'avatar')) {
                $table->string('avatar')->nullable();
            }
            if (!Schema::hasColumn('users', 'bonus_points')) {
                $table->integer('bonus_points')->default(0);
            }
            if (!Schema::hasColumn('users', 'saved_addresses')) {
                $table->json('saved_addresses')->nullable();
            }
        });

        // 2. Products table
        Schema::create('products', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('slug')->unique();
            $table->string('name_fr');
            $table->string('name_en')->nullable();
            $table->string('name_es')->nullable();
            $table->string('brand')->nullable();
            $table->string('category')->default('shoes');
            $table->decimal('price', 12, 2);
            $table->decimal('compare_price', 12, 2)->nullable();
            $table->integer('stock')->default(45);
            $table->boolean('is_new')->default(true);
            $table->boolean('is_featured')->default(false);
            $table->boolean('delivery_48h')->default(true);
            $table->decimal('rating', 3, 2)->default(5.00);
            $table->integer('review_count')->default(0);
            $table->string('badge')->nullable();
            $table->text('description_fr')->nullable();
            $table->text('description_en')->nullable();
            $table->text('description_es')->nullable();
            $table->json('images')->nullable();
            $table->json('colors')->nullable();
            $table->json('sizes')->nullable();
            $table->json('location_prices')->nullable();
            $table->json('location_compare_prices')->nullable();
            $table->string('variant_type')->nullable();
            $table->string('variant_label')->nullable();
            $table->timestamps();
        });

        // 3. Orders table
        Schema::create('orders', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('order_number')->unique();
            $table->string('customer_email');
            $table->string('customer_name')->nullable();
            $table->decimal('total', 12, 2);
            $table->string('currency')->default('EUR');
            $table->decimal('discount_applied', 12, 2)->default(0);
            $table->string('promo_code_used')->nullable();
            $table->string('status')->default('PENDING'); // PENDING, SHIPPED, DELIVERED
            $table->string('payment_status')->default('UNPAID');
            $table->string('payment_method')->default('COD');
            $table->string('payment_transaction_id')->nullable();
            $table->json('shipping_address')->nullable();
            $table->json('items')->nullable();
            $table->string('tracking_number')->nullable();
            $table->string('carrier_name')->nullable();
            $table->string('carrier_phone')->nullable();
            $table->string('current_location')->nullable();
            $table->string('tracking_status_text')->nullable();
            $table->integer('tracking_step')->default(1);
            $table->string('estimated_delivery_date')->nullable();
            $table->json('tracking_history')->nullable();
            $table->timestamps();
        });

        // 4. Order Items table
        Schema::create('order_items', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('order_id');
            $table->string('product_id');
            $table->string('product_name');
            $table->integer('quantity');
            $table->decimal('price', 12, 2);
            $table->string('color')->nullable();
            $table->string('size')->nullable();
            $table->timestamps();

            $table->foreign('order_id')->references('id')->on('orders')->onDelete('cascade');
        });

        // 5. Settings table (Key-Value)
        Schema::create('settings', function (Blueprint $table) {
            $table->string('key')->primary();
            $table->text('value')->nullable();
            $table->timestamps();
        });

        // 6. Coupons table
        Schema::create('coupons', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->string('type')->default('percent'); // percent or fixed
            $table->decimal('value', 8, 2);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // 7. Blog Posts table
        Schema::create('blog_posts', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('slug')->unique();
            $table->string('title');
            $table->string('subtitle')->nullable();
            $table->string('category')->default('sneakers');
            $table->string('read_time')->default('5 min');
            $table->string('image');
            $table->text('content')->nullable();
            $table->boolean('published')->default(true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('blog_posts');
        Schema::dropIfExists('coupons');
        Schema::dropIfExists('settings');
        Schema::dropIfExists('order_items');
        Schema::dropIfExists('orders');
        Schema::dropIfExists('products');
    }
};
