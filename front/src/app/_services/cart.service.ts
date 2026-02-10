import { Injectable } from '@angular/core';

import { LineItem } from '../_models/Payment';
@Injectable({
  providedIn: 'root',
})
export class CartService {
  constructor() {}

  isCartEmpty(): boolean {
    const cart = this.getCart();
    return cart.length === 0;
  }

  getAmountItems(): number {
    const cart = this.getCart();
    return cart.reduce((acc, item) => acc + item.quantity, 0);
  }

  getCart(): LineItem[] {
    const cartstring = window.localStorage.getItem('cart');
    let cart: LineItem[];
    if (cartstring) {
      cart = JSON.parse(cartstring);
    } else {
      cart = [];
    }
    return cart;
  }

  addToCart(lineItem: LineItem): LineItem[] {
    const cart: LineItem[] = this.getCart();
    if (cart.find(item => item.price === lineItem.price)) {
      cart.map(item => {
        if (item.price === lineItem.price) {
          item.quantity += lineItem.quantity;
        }
        return item;
      });
      window.localStorage.setItem('cart', JSON.stringify(cart));
      return cart;
    }
    cart.push(lineItem);
    window.localStorage.setItem('cart', JSON.stringify(cart));
    return cart;
  }

  removeFromCart(lineItem: LineItem): LineItem[] {
    const cart: LineItem[] = this.getCart();
    const newCart = cart.filter(item => item.price !== lineItem.price);
    window.localStorage.setItem('cart', JSON.stringify(newCart));
    return newCart;
  }

  updatequantityInCart(price: string, quantity: number): LineItem[] {
    const cart: LineItem[] = this.getCart();
    const newCart = cart.map(item => {
      if (item.price === price) {
        item.quantity = quantity;
      }
      return item;
    });
    window.localStorage.setItem('cart', JSON.stringify(newCart));
    return newCart;
  }

  clearCart(): void {
    window.localStorage.removeItem('cart');
  }
}
