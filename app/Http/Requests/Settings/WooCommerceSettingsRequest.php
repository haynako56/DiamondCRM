<?php

namespace App\Http\Requests\Settings;

use Illuminate\Foundation\Http\FormRequest;

class WooCommerceSettingsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'consumer' => ['nullable', 'string', 'max:191'],
            'secret' => ['nullable', 'string', 'max:191'],
        ];
    }
}
