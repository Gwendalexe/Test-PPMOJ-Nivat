import { NgIf } from '@angular/common';
import {
  Component,
  HostBinding,
  HostListener,
  Input,
  OnInit,
  ViewEncapsulation,
} from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from 'src/app/_services/auth.service';
import { GameCard } from 'src/app/pages/home/home.component';

@Component({
  selector: 'app-game-card',
  templateUrl: './game-card.component.html',
  styleUrls: ['./game-card.component.scss'],
  host: { class: 'game-card' },
  encapsulation: ViewEncapsulation.None,
  imports: [NgIf],
})
export class GameCardComponent implements OnInit {
  // class="" [ngClass]="[ isConnected && isConfirmed ? 'clickable' : '' ]" (click)="isConnected && isConfirmed && goToDestination()">
  isConnected = false;
  isConfirmed = false;
  private userConfirmationSubscription: Subscription; //important to create a subscription
  private userInfoSubscription: Subscription; //important to create a subscription

  @Input() card: GameCard;
  @HostBinding('class.clickable') clickableFlag = false;
  @HostListener('click') clickableCardAction() {
    if (window.innerWidth <= 768) return;
    this.goToDestination();
  }

  constructor(
    private router: Router,
    private authService: AuthService
  ) {
    this.userConfirmationSubscription = this.authService
      .getUpdateConfirmation()
      .subscribe(value => {
        //message contains the data sent from service
        this.isConfirmed = value;
      });

    this.userInfoSubscription = this.authService
      .getUpdateInfo()
      .subscribe(value => {
        //message contains the data sent from service
        if (value != null) {
          this.isConnected = true;
          this.isConfirmed = value.confirmed;
          console.log(
            window.innerWidth,
            this.isConfirmed && window.innerWidth >= 768
          );
          this.clickableFlag = this.isConfirmed && window.innerWidth >= 768;
        } else {
          this.isConnected = false;
          this.isConfirmed = false;
          this.clickableFlag = false;
        }
      });
  }

  ngOnInit() {
    this.isConnected = localStorage.hasOwnProperty('currentUser');
    if (!this.isConnected) return;
    this.isConfirmed = JSON.parse(
      localStorage.getItem('currentUser')!
    ).confirmed;
    this.clickableFlag = this.isConnected && this.isConfirmed;
  }
  goToDestination = (): Promise<boolean> =>
    this.router.navigate([`/${this.card.destination}`]);
}
