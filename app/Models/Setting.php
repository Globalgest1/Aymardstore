<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Setting extends Model
{
    public $incrementing = false;
    protected $primaryKey = 'key';
    protected $keyType = 'string';

    protected $guarded = [];

    public static function get($key, $default = null)
    {
        $item = static::find($key);
        if (!$item) return $default;
        $val = json_decode($item->value, true);
        return $val !== null ? $val : $item->value;
    }

    public static function set($key, $value)
    {
        $valStr = is_array($value) ? json_encode($value) : (string)$value;
        return static::updateOrCreate(['key' => $key], ['value' => $valStr]);
    }
}
