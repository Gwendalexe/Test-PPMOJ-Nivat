import { NgClass, NgIf } from '@angular/common';
import {
  AfterViewInit,
  Component,
  EventEmitter,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from 'src/app/_services/auth.service';
import { CartService } from 'src/app/_services/cart.service';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
  host: { class: 'navbar-component' },
  imports: [NgIf, NgClass],
})
export class NavbarComponent implements OnInit, AfterViewInit, OnDestroy {
  @Output() openDialog: EventEmitter<any> = new EventEmitter();

  dialogCallback(): void {
    this.openDialog.emit();
  }

  username!: string;
  mojettes = 0;
  tokenCoins = 0;
  alertDismissed = false;

  private mojetteSubscription: Subscription; //important to create a subscription
  private tokenCoinSubscription: Subscription; //important to create a subscription
  private userInfoSubscription: Subscription; //important to create a subscription
  private routerSubscription: Subscription;
  private readonly lightBackgroundRoutes = new Set(['histoire', 'boutique', 'cart', 'formation']);

  currentRouteSegment = '';
  shouldUseDarkTitle = false;

  constructor(
    private router: Router,
    private authService: AuthService,
    private cartService: CartService
  ) {
    this.mojetteSubscription = this.authService
      .getUpdateMojette()
      .subscribe(value => {
        this.mojettes = value;
      });

    this.tokenCoinSubscription = this.authService
      .getUpdateTokenCoin()
      .subscribe(value => {
        this.tokenCoins = value;
      });

    this.userInfoSubscription = this.authService
      .getUpdateInfo()
      .subscribe(value => {
        //message contains the data sent from service
        if (value != null) {
          this.username = value.username;
          this.mojettes = value.mojettes;
        }
      });

    this.updateRouteContext(this.router.url);
    this.routerSubscription = this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.updateRouteContext(event.urlAfterRedirects);
      }
    });
  }

  ngOnInit(): void {
    this.refreshUserData();
    this.alertDismissed =
      JSON.parse(localStorage.getItem('alertDismissed') || '{}') || false;
  }

  ngAfterViewInit(): void {
    this.refreshUserData();
  }

  ngOnDestroy() {
    // It's a good practice to unsubscribe to ensure no memory leaks
    this.mojetteSubscription.unsubscribe();
    this.tokenCoinSubscription.unsubscribe();
    this.userInfoSubscription.unsubscribe();
    this.routerSubscription.unsubscribe();
  }

  setAlertDismissed = () => {
    localStorage.setItem('alertDismissed', 'true');
  };

  isConnected = (): boolean =>
    Object.prototype.hasOwnProperty.call(localStorage, 'currentUser');

  isCartEmpty = (): boolean => this.cartService.isCartEmpty();

  getCartNumber = (): number => this.cartService.getAmountItems();

  refreshUserData = (): void => {
    const currentUserString = localStorage.getItem('currentUser');
    if (!currentUserString) return;
    const currentUser = JSON.parse(currentUserString || '');
    this.username = currentUser.username;
    this.tokenCoins = currentUser.token_coin;
    this.mojettes = currentUser.mojettes;
  };

  logout(): void {
    this.authService.logout();
    // this.onLogout.emit();
  }

  isHomePage = (): boolean => ['', 'formations'].includes(this.currentRouteSegment);

  goToProfilePage = () => this.router.navigate(['/account']);

  private updateRouteContext(url: string): void {
    const [path] = url.split('?');
    const segment = path
      .split('/')
      .filter(Boolean)
      .shift();
    this.currentRouteSegment = segment || '';
    this.shouldUseDarkTitle = this.lightBackgroundRoutes.has(this.currentRouteSegment);
  }
}
