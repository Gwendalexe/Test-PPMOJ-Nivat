import { NgFor, NgIf } from '@angular/common';
import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from 'src/app/_services/auth.service';
import { CartService } from 'src/app/_services/cart.service';
import { ConfettiService } from 'src/app/_services/confetti.service';
import { CarrouselCardComponent } from 'src/app/components/carrousel/carrousel-card/carrousel-card.component';
import { CarrouselComponent } from 'src/app/components/carrousel/carrousel.component';
import { GameCardComponent } from 'src/app/components/game-card/game-card.component';
import { NavbarComponent } from 'src/app/components/navbar/navbar.component';
import { RegisterComponent } from 'src/app/components/register/register.component';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  host: { class: 'dark-theme' },
  standalone: true,
  imports: [
    NavbarComponent,
    RegisterComponent,
    NgFor,
    NgIf,
    GameCardComponent,
    CarrouselCardComponent,
    CarrouselComponent,
  ],
})
export class HomeComponent implements OnInit, AfterViewInit {
  isRegisterMode = false;

  isConnected = false;
  isConfirmed = false;
  showPaymentSuccess = false;

  gameCards: Array<GameCard> = [
    {
      title: 'VADROUILLE EN FRANCE',
      description:
        'Résous des énigmes en visitant la France. Sauras-tu répondre aux problèmes du Professeur Mojette?',
      destination: 'vef',
    },
    {
      title: 'JEU MOJETTE',
      description:
        "Remplis ta grille quotidienne du célèbre jeu mojette en trouvant les 3 chiffres adaptés, avant d'affronter une centaine de niveaux, répartis en 3 difficultés.",
      destination: 'mojette',
    },
    {
      title: 'LES CARRÉS DE DUDENEY',
      description:
        "Complète chaque puzzle rectangulaire en plaçant des carrés de différentes tailles avec réflexion et stratégie, pour éviter de te bloquer ! Défie ensuite une centaine de niveaux pour remporter facilement des mojettes qui t'aideront dans les différents jeux.",
      destination: 'carredudeney',
    },
    // TA CARTE AJOUTÉE ICI :
    {
      title: 'JEU MAURICE NIVAT',
      description:
        'Résouds ta grille quotidienne du jeu rendant hommage au célèbre mathématicien Maurice NIVAT en faisant en sorte que toutes les lignes et toutes les colonnes de la grille aient autant de cellules rouges que de cellules bleues.',
      destination: 'nivat',
    },
  ];

  private userConfirmationSubscription: Subscription;
  private userInfoSubscription: Subscription;

  constructor(
    private router: Router,
    private authService: AuthService,
    private cartService: CartService,
    private activatedRoute: ActivatedRoute,
    private confettiService: ConfettiService
  ) {
    this.userConfirmationSubscription = this.authService
      .getUpdateConfirmation()
      .subscribe(value => {
        this.isConfirmed = value;
      });

    this.userInfoSubscription = this.authService
      .getUpdateInfo()
      .subscribe(value => {
        if (value != null) {
          this.isConnected = true;
          this.isConfirmed = value.confirmed;
        } else {
          this.isConnected = false;
          this.isConfirmed = false;
        }
      });
  }

  @ViewChild(NavbarComponent) navbar: NavbarComponent;

  ngOnInit(): void {
    this.isConnected = Object.hasOwn(localStorage, 'currentUser');
    if (!this.isConnected) return;
    this.isConfirmed = JSON.parse(
      localStorage.getItem('currentUser') ?? ''
    ).confirmed;

    // Gestion du succès de paiement (Sprint December feature)
    const doCartReset =
      this.activatedRoute.snapshot.queryParamMap.get('resetCart');
    if (doCartReset) {
      this.cartService.clearCart();
      this.authService.reloadUser(false);
      this.showPaymentSuccess = true;
      this.confettiService.triggerShort();
      this.router.navigate([], {
        queryParams: { resetCart: null },
        queryParamsHandling: 'merge',
      });
    }
  }

  ngAfterViewInit(): void {
    // Méthode vide requise par l'interface AfterViewInit
    // L'ancienne logique manuelle du carrousel a été supprimée au profit du composant CarrouselComponent
  }

  openDialog() {
    const connectDialog: HTMLDivElement | null = document.getElementById(
      'connectDialog'
    ) as HTMLDivElement | null;
    if (connectDialog instanceof HTMLDialogElement) connectDialog.showModal();
  }

  goToPage = (page: string): Promise<boolean> =>
    this.router.navigate([`/${page}`]);

  closePaymentSuccess(): void {
    this.showPaymentSuccess = false;
  }
}

export interface GameCard {
  title: string;
  description: string;
  destination: string;
}
