import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, mergeMap, Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { LineItem, MojetteShop, TokenShop } from '../_models/Payment';

@Injectable({
  providedIn: 'root',
})
export class PaymentService {
  private baseUrl = environment.apiUrl;
  userId: string | undefined;

  constructor(private http: HttpClient) {}

  getProducts(): Observable<any> {
    const url = `${this.baseUrl}/payment/product`;
    return this.http.get(url);
  }

  getPrices(): Observable<any> {
    const url = `${this.baseUrl}/payment/prices`;
    return this.http.get(url);
  }

  getMojettePrices(): Observable<MojetteShop[]> {
    return this.getProducts().pipe(
      map(products => {
        return products.filter(
          (product: any) => product?.metadata?.type === 'mojette'
        )[0].id;
      }),
      mergeMap(id => {
        const url = `${this.baseUrl}/payment/product/${id}/prices`;
        return this.http.get(url);
      }),
      map((prices: any) => {
        return prices.map((price: any) => {
          return {
            id: price.id,
            mojette: price.transform_quantity.divide_by,
            price: price.unit_amount / 100,
          };
        });
      })
    );
  }

  getTokensPrices(): Observable<TokenShop[]> {
    return this.getProducts().pipe(
      map(products => {
        return products.filter(
          (product: any) => product?.metadata?.type === 'token'
        )[0].id;
      }),
      mergeMap(id => {
        const url = `${this.baseUrl}/payment/product/${id}/prices`;
        return this.http.get(url);
      }),
      map((prices: any) => {
        return prices.map((price: any) => {
          return {
            id: price.id,
            token: price.transform_quantity.divide_by,
            price: price.unit_amount / 100,
            promoMojette: price.metadata.promo_mojette === 'true',
            promoMojetteAmount:
              price.metadata.promo_mojette === 'true'
                ? Number(price.metadata.promo_mojette_amount)
                : 0,
          };
        });
      })
    );
  }

  createCheckoutSession(lineItems: LineItem[]): Observable<any> {
    const url = `${this.baseUrl}/payment/create-checkout-session`;
    return this.http.post(url, { line_items: lineItems });
  }

  success(): Observable<any> {
    const url = `${this.baseUrl}/payment/success`;
    return this.http.get(url);
  }

  cancel(): Observable<any> {
    const url = `${this.baseUrl}/payment/cancel`;
    return this.http.get(url);
  }
}
