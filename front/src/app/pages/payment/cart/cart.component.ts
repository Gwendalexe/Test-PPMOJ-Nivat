import { NgFor, NgIf } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { StripeService } from 'ngx-stripe';
import { switchMap } from 'rxjs';
import { CartItem, LineItem } from 'src/app/_models/Payment';
import { CartService } from 'src/app/_services/cart.service';
import { PaymentService } from 'src/app/_services/payment.service';
import { NavbarComponent } from 'src/app/components/navbar/navbar.component';

@Component({
  selector: 'app-cart',
  imports: [NavbarComponent, NgFor, NgIf],
  templateUrl: './cart.component.html',
  styleUrl: './cart.component.scss',
  host: { class: 'light-theme' },
})
export class CartComponent implements OnInit {
  cartItems: CartItem[] = [];
  total_euro = 0;
  total_mojette = 0;
  constructor(
    private cartService: CartService,
    private paymentService: PaymentService,
    private stripeService: StripeService
  ) {}

  ngOnInit(): void {
    this.paymentService.getPrices().subscribe(prices => {
      prices = prices.reduce((acc: any, price: any) => {
        acc[price['id']] = price;
        return acc;
      }, {});
      this.paymentService.getProducts().subscribe(products => {
        products = products.reduce((acc: any, product: any) => {
          acc[product['id']] = product;
          return acc;
        }, {});
        const items = this.cartService.getCart();
        this.cartItems = items.map((item: LineItem) => {
          const price = prices[item.price];
          const product = products[price.product];

          return {
            ...item,
            name: product.name,
            image: product.images[0],
            amount: price.transform_quantity.divide_by ?? 1,
            euro_unit_amount: price.unit_amount / 100,
            mojette_unit_amount: price?.metadata?.promo_mojette_amount ?? 0,
          } as CartItem;
        });
        this.updateTotal();
      });
    });
  }

  updateTotal() {
    this.total_euro = this.cartItems.reduce(
      (acc, item) => acc + item.euro_unit_amount * item.quantity,
      0
    );
    this.total_mojette = this.cartItems.reduce(
      (acc, item) => acc + item.mojette_unit_amount * item.quantity,
      0
    );
  }

  removeItem(item: CartItem) {
    this.cartService.removeFromCart(item);
    this.cartItems = this.cartItems.filter(
      cartItem => cartItem.price !== item.price
    );
    this.updateTotal();
  }

  incrementQuantity(item: CartItem) {
    this.cartService.updatequantityInCart(item.price, item.quantity + 1);
    this.cartItems = this.cartItems.map(cartItem => {
      if (cartItem.price === item.price) {
        cartItem.quantity++;
      }
      return cartItem;
    });
    this.updateTotal();
  }

  decrementQuantity(item: CartItem) {
    if (item.quantity === 1) {
      return;
    }
    this.cartService.updatequantityInCart(item.price, item.quantity - 1);
    this.cartItems = this.cartItems.map(cartItem => {
      if (cartItem.price === item.price) {
        cartItem.quantity--;
      }
      return cartItem;
    });
    this.updateTotal();
  }

  isCartEmpty() {
    return this.cartService.isCartEmpty() || this.cartItems.length === 0;
  }

  checkout() {
    if (this.isCartEmpty()) {
      return;
    }
    if (this.total_mojette > 0) {
      const current_user = window.localStorage.getItem('currentUser');
      if (!current_user) {
        return;
      }
      const user_mojette = JSON.parse(current_user)?.['mojettes'] ?? 0;
      if (user_mojette < this.total_mojette) {
        alert('Vous ne possédez pas assez de mojette pour effectuer cet achat');
        return;
      }
    }
    const cart = this.cartService.getCart();
    this.paymentService
      .createCheckoutSession(cart)
      .pipe(
        switchMap((session: any) => {
          return this.stripeService.redirectToCheckout({
            sessionId: session.id,
          });
        })
      )
      .subscribe(result => {
        if (result.error) {
          alert(result.error.message);
        }
      });
  }

  handleImageError(event: any) {
    event.target.src = 'assets/beans.svg';
  }
}
