export interface MojetteShop {
  id: string; // stripe price id
  mojette: number;
  price: number;
}

export interface TokenShop {
  id: string; // stripe price id
  token: number;
  price: number;
  promoMojette: boolean;
  promoMojetteAmount: number;
}

export interface LineItem {
  price: string; // stripe price id
  quantity: number;
}

export interface CartItem extends LineItem {
  name: string;
  description: string;
  image: string;
  amount: number;
  euro_unit_amount: number;
  mojette_unit_amount: number;
}
