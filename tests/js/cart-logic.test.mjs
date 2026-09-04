import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

describe('Cart Business Logic Test Suite', () => {
  function createCart() {
    let items = [];

    return {
      getItems: () => items,
      addItem: (product, quantity = 1, size = null, color = null) => {
        if (!product || !product.id || quantity <= 0) return;
        const existingIndex = items.findIndex(
          (i) => i.product.id === product.id && i.size === size && i.color === color
        );
        if (existingIndex > -1) {
          const newQty = items[existingIndex].quantity + quantity;
          const maxStock = product.stock ?? 999;
          items[existingIndex].quantity = Math.min(newQty, maxStock);
        } else {
          const maxStock = product.stock ?? 999;
          items.push({
            product,
            quantity: Math.min(quantity, maxStock),
            size,
            color,
          });
        }
      },
      updateQuantity: (productId, size, color, quantity) => {
        const index = items.findIndex(
          (i) => i.product.id === productId && i.size === size && i.color === color
        );
        if (index > -1) {
          if (quantity <= 0) {
            items.splice(index, 1);
          } else {
            const maxStock = items[index].product.stock ?? 999;
            items[index].quantity = Math.min(quantity, maxStock);
          }
        }
      },
      removeItem: (productId, size, color) => {
        items = items.filter(
          (i) => !(i.product.id === productId && i.size === size && i.color === color)
        );
      },
      clearCart: () => {
        items = [];
      },
      getSubtotal: () => {
        return items.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);
      },
      getTotalItemCount: () => {
        return items.reduce((acc, item) => acc + item.quantity, 0);
      }
    };
  }

  test('Cart starts empty with 0 items and 0 subtotal', () => {
    const cart = createCart();
    assert.strictEqual(cart.getItems().length, 0);
    assert.strictEqual(cart.getSubtotal(), 0);
    assert.strictEqual(cart.getTotalItemCount(), 0);
  });

  test('Adding an item adds it to cart and calculates subtotal correctly', () => {
    const cart = createCart();
    const product1 = { id: 'sneaker_1', name_fr: 'Dunk Low', price: 120, stock: 5 };
    cart.addItem(product1, 2, '42', 'Black/White');

    assert.strictEqual(cart.getItems().length, 1);
    assert.strictEqual(cart.getTotalItemCount(), 2);
    assert.strictEqual(cart.getSubtotal(), 240);
  });

  test('Adding same product with same size increases quantity without duplicate entry', () => {
    const cart = createCart();
    const product1 = { id: 'sneaker_1', name_fr: 'Dunk Low', price: 120, stock: 10 };
    cart.addItem(product1, 1, '42', 'Black/White');
    cart.addItem(product1, 2, '42', 'Black/White');

    assert.strictEqual(cart.getItems().length, 1);
    assert.strictEqual(cart.getTotalItemCount(), 3);
    assert.strictEqual(cart.getSubtotal(), 360);
  });

  test('Adding same product with different size creates distinct line item', () => {
    const cart = createCart();
    const product1 = { id: 'sneaker_1', name_fr: 'Dunk Low', price: 120, stock: 10 };
    cart.addItem(product1, 1, '42', 'Black/White');
    cart.addItem(product1, 1, '43', 'Black/White');

    assert.strictEqual(cart.getItems().length, 2);
    assert.strictEqual(cart.getTotalItemCount(), 2);
    assert.strictEqual(cart.getSubtotal(), 240);
  });

  test('Quantity cannot exceed product stock', () => {
    const cart = createCart();
    const productLimited = { id: 'rare_sneaker', name_fr: 'Jordan 1 Travis', price: 500, stock: 2 };
    cart.addItem(productLimited, 5, '42', 'Mocha');

    // Should be capped at 2
    assert.strictEqual(cart.getItems()[0].quantity, 2);
    assert.strictEqual(cart.getSubtotal(), 1000);
  });

  test('Updating quantity to 0 removes item from cart', () => {
    const cart = createCart();
    const product1 = { id: 'sneaker_1', price: 100, stock: 5 };
    cart.addItem(product1, 2, '42', 'White');
    cart.updateQuantity('sneaker_1', '42', 'White', 0);

    assert.strictEqual(cart.getItems().length, 0);
    assert.strictEqual(cart.getSubtotal(), 0);
  });
});
