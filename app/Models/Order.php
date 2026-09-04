<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    public $incrementing = false;
    protected $keyType = 'string';

    protected $guarded = [];

    protected $casts = [
        'shipping_address' => 'array',
        'items' => 'array',
        'tracking_history' => 'array',
        'total' => 'float',
        'discount_applied' => 'float',
        'tracking_step' => 'integer',
    ];

    protected $appends = [
        'orderNumber',
        'customerEmail',
        'customerName',
        'customerPhone',
        'date',
        'discountApplied',
        'promoCodeUsed',
        'paymentStatus',
        'paymentMethod',
        'paymentTransactionId',
        'trackingNumber',
        'shippingAddress',
        'carrierName',
        'carrierPhone',
        'currentLocation',
        'trackingStatusText',
        'trackingStep',
        'estimatedDeliveryDate',
        'trackingHistory',
    ];

    public function getOrderNumberAttribute()
    {
        return $this->attributes['order_number'] ?? null;
    }

    public function getCustomerEmailAttribute()
    {
        return $this->attributes['customer_email'] ?? null;
    }

    public function getCustomerNameAttribute()
    {
        return $this->attributes['customer_name'] ?? null;
    }

    public function getCustomerPhoneAttribute()
    {
        $addr = $this->shipping_address;
        return is_array($addr) ? ($addr['phone'] ?? null) : null;
    }

    public function getDateAttribute()
    {
        return $this->created_at ? $this->created_at->format('d/m/Y') : date('d/m/Y');
    }

    public function getDiscountAppliedAttribute()
    {
        return $this->attributes['discount_applied'] ?? 0;
    }

    public function getPromoCodeUsedAttribute()
    {
        return $this->attributes['promo_code_used'] ?? null;
    }

    public function getPaymentStatusAttribute()
    {
        return $this->attributes['payment_status'] ?? 'UNPAID';
    }

    public function getPaymentMethodAttribute()
    {
        return $this->attributes['payment_method'] ?? 'COD';
    }

    public function getPaymentTransactionIdAttribute()
    {
        return $this->attributes['payment_transaction_id'] ?? null;
    }

    public function getTrackingNumberAttribute()
    {
        return $this->attributes['tracking_number'] ?? null;
    }

    public function getShippingAddressAttribute()
    {
        $val = $this->attributes['shipping_address'] ?? null;
        if (is_string($val)) {
            return json_decode($val, true);
        }
        return $val;
    }

    public function getCarrierNameAttribute()
    {
        return $this->attributes['carrier_name'] ?? null;
    }

    public function getCarrierPhoneAttribute()
    {
        return $this->attributes['carrier_phone'] ?? null;
    }

    public function getCurrentLocationAttribute()
    {
        return $this->attributes['current_location'] ?? null;
    }

    public function getTrackingStatusTextAttribute()
    {
        return $this->attributes['tracking_status_text'] ?? null;
    }

    public function getTrackingStepAttribute()
    {
        return $this->attributes['tracking_step'] ?? 1;
    }

    public function getEstimatedDeliveryDateAttribute()
    {
        return $this->attributes['estimated_delivery_date'] ?? null;
    }

    public function getTrackingHistoryAttribute()
    {
        $val = $this->attributes['tracking_history'] ?? null;
        if (is_string($val)) {
            return json_decode($val, true);
        }
        return $val;
    }

    public function itemsRelation()
    {
        return $this->hasMany(OrderItem::class, 'order_id', 'id');
    }
}
