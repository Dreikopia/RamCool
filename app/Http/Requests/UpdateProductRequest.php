<?php

namespace App\Http\Requests;

use App\Enums\ProductStatus;
use App\Models\Product;
use App\Models\Supplier;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateProductRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'image' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
            'remove_image' => ['sometimes', 'boolean'],
            'sku' => [
                'required',
                'string',
                'max:255',
                Rule::unique('products', 'sku')->ignore($this->route('product')),
            ],
            'status' => ['sometimes', 'required', Rule::enum(ProductStatus::class)],
            'category_id' => ['required', 'exists:categories,id'],
            'supplier_id' => [
                'nullable',
                function ($attribute, $value, $fail) {
                    $product = $this->route('product');

                    // Editing a product keeps its existing supplier even when inactive.
                    if ($product instanceof Product && (int) $product->supplier_id === (int) $value) {
                        return;
                    }

                    if (! Supplier::whereKey($value)->where('is_active', true)->exists()) {
                        $fail('The selected supplier is not active.');
                    }
                },
            ],
            'unit_price' => ['required', 'numeric', 'min:0'],
            'reorder_level' => ['required', 'integer', 'min:0'],
        ];
    }

    /**
     * Get custom messages for validator errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'image.max' => 'The image must be 2 MB or smaller.',
        ];
    }
}
