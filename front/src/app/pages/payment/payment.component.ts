import { NgFor, NgIf } from '@angular/common';
import { AfterViewInit, Component, ElementRef, QueryList, ViewChildren } from '@angular/core';
import { MojetteShop, TokenShop } from 'src/app/_models/Payment';
import { CartService } from 'src/app/_services/cart.service';
import { PaymentService } from 'src/app/_services/payment.service';
import { NavbarComponent } from '../../components/navbar/navbar.component';

@Component({
  selector: 'app-payment',
  templateUrl: './payment.component.html',
  styleUrls: ['./payment.component.scss'],
  host: { class: 'light-theme' },
  imports: [NavbarComponent, NgFor, NgIf],
})
export class PaymentComponent implements AfterViewInit {
  mojettes: MojetteShop[] = [];
  tokens: TokenShop[][] = [];
  isLoading: boolean = true;
  loadedImages: number = 0;
  totalImages: number = 0;

  @ViewChildren('illustrationImg') images!: QueryList<ElementRef<HTMLImageElement>>;

  openDialog() {
    const connectDialog: HTMLDivElement | null = document.getElementById(
      'connectDialog'
    ) as HTMLDivElement | null;
    if (connectDialog instanceof HTMLDialogElement) connectDialog.showModal();
  }

  constructor(
    private paymentService: PaymentService,
    private cartService: CartService
  ) {
    this.paymentService
      .getMojettePrices()
      .subscribe((prices: MojetteShop[]) => {
        this.mojettes = prices.sort(
          (a: MojetteShop, b: MojetteShop) => a.mojette - b.mojette
        );
        this.updateTotalImages();
      });
    this.paymentService.getTokensPrices().subscribe((prices: TokenShop[]) => {
      if (prices.length != 10) {
        console.log('Error: prices.length != 10');
        return;
      }
      this.tokens = prices
        .sort(
          (a: TokenShop, b: TokenShop) =>
            a.token - b.token || a.promoMojetteAmount - b.promoMojetteAmount
        )
        .reduce((acc: TokenShop[][], curr: TokenShop, index: number) => {
          if (index % 2 === 0) acc.push([curr]);
          else acc[acc.length - 1].push(curr);
          return acc;
        }, []);
      this.updateTotalImages();
    });
  }

  ngAfterViewInit() {
    // Wait for images to be available and attach load handlers
    setTimeout(() => {
      this.attachImageLoadHandlers();
    }, 100);
  }

  updateTotalImages() {
    // Calculate total images: mojettes count + tokens count + 1 bean icon per token pair
    const mojetteImages = this.mojettes.length;
    const tokenImages = this.tokens.length;
    const beanIcons = this.tokens.length;
    const newTotal = mojetteImages + tokenImages + beanIcons;

    // Only update if we have both mojettes and tokens data, or if one is complete
    const hasMojettes = this.mojettes.length > 0;
    const hasTokens = this.tokens.length > 0;

    // If total changed and we have data, reset counter and re-attach handlers
    if (newTotal !== this.totalImages && newTotal > 0) {
      this.totalImages = newTotal;
      this.loadedImages = 0;

      // Re-attach handlers after data update
      setTimeout(() => {
        this.attachImageLoadHandlers();
      }, 150);
    }

    // If we already have all data and no images to load, hide loading
    if (this.totalImages === 0) {
      this.isLoading = false;
    }
  }

  attachImageLoadHandlers() {
    // Handle main illustration images
    if (this.images && this.images.length > 0) {
      this.images.forEach((imgRef) => {
        const img = imgRef.nativeElement;
        // Check if image is already loaded
        if (img.complete && img.naturalWidth > 0) {
          this.onImageLoad();
        } else {
          // Attach load/error handlers (using once to prevent duplicate calls)
          const loadHandler = () => this.onImageLoad();
          const errorHandler = () => this.onImageLoad();
          img.addEventListener('load', loadHandler, { once: true });
          img.addEventListener('error', errorHandler, { once: true });
        }
      });
    }

    // Also handle the bean icon images
    setTimeout(() => {
      const beanIcons = document.querySelectorAll('.mojette-icon');
      beanIcons.forEach((img) => {
        const htmlImg = img as HTMLImageElement;
        if (htmlImg.complete && htmlImg.naturalWidth > 0) {
          this.onImageLoad();
        } else {
          htmlImg.addEventListener('load', () => this.onImageLoad(), { once: true });
          htmlImg.addEventListener('error', () => this.onImageLoad(), { once: true });
        }
      });
    }, 50);
  }

  onImageLoad() {
    this.loadedImages++;
    if (this.loadedImages >= this.totalImages && this.totalImages > 0) {
      // Small delay for smooth transition
      setTimeout(() => {
        this.isLoading = false;
      }, 300);
    }
  }

  addtocart(price: string) {
    this.cartService.addToCart({ price, quantity: 1 });
  }

  getMojetteAsset(quantity: number): string {
    return `assets/boutique/mojettes/mojettes_x${quantity}.png`;
  }

  getFormationAsset(tokenCount: number): string {
    return `assets/boutique/formations/formation_${tokenCount}x.png`;
  }
}
