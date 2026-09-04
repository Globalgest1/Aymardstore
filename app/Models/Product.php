<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    public $incrementing = false;
    protected $keyType = 'string';

    protected $guarded = [];

    protected $casts = [
        'images' => 'array',
        'colors' => 'array',
        'sizes' => 'array',
        'location_prices' => 'array',
        'location_compare_prices' => 'array',
        'is_new' => 'boolean',
        'is_featured' => 'boolean',
        'delivery_48h' => 'boolean',
        'price' => 'float',
        'compare_price' => 'float',
        'rating' => 'float',
        'review_count' => 'integer',
        'stock' => 'integer',
    ];

    protected $appends = [
        'name',
        'image',
        'isNew',
        'isFeatured',
        'comparePrice',
        'delivery48H',
        'reviewCount',
        'locationPrices',
        'locationComparePrices',
        'variantType',
        'variantLabel',
    ];

    public function getNameAttribute()
    {
        return $this->attributes['name'] ?? $this->attributes['name_fr'] ?? $this->attributes['name_en'] ?? '';
    }

    public function getImageAttribute()
    {
        if (!empty($this->attributes['image'])) {
            return $this->attributes['image'];
        }
        $images = $this->images;
        return (is_array($images) && count($images) > 0) ? $images[0] : '/placeholder.png';
    }

    public function getIsNewAttribute()
    {
        return (bool) ($this->attributes['is_new'] ?? false);
    }

    public function getIsFeaturedAttribute()
    {
        return (bool) ($this->attributes['is_featured'] ?? false);
    }

    public function getComparePriceAttribute()
    {
        $val = $this->attributes['compare_price'] ?? null;
        return $val !== null ? (float) $val : null;
    }

    public function getDelivery48HAttribute()
    {
        return (bool) ($this->attributes['delivery_48h'] ?? false);
    }

    public function getReviewCountAttribute()
    {
        return (int) ($this->attributes['review_count'] ?? 0);
    }

    public function getLocationPricesAttribute()
    {
        $val = $this->attributes['location_prices'] ?? null;
        return is_string($val) ? json_decode($val, true) : $val;
    }

    public function getLocationComparePricesAttribute()
    {
        $val = $this->attributes['location_compare_prices'] ?? null;
        return is_string($val) ? json_decode($val, true) : $val;
    }

    public function getVariantTypeAttribute()
    {
        return $this->attributes['variant_type'] ?? null;
    }

    public function getVariantLabelAttribute()
    {
        return $this->attributes['variant_label'] ?? null;
    }
}
