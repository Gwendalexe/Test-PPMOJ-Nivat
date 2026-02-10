import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from 'src/app/_services/auth.service';
import { InternalService } from 'src/app/_services/internal.service';
import { MatCardTitle, MatCardContent } from '@angular/material/card';

@Component({
    selector: 'app-account_confirmation',
    templateUrl: './account_confirmation.component.html',
    styleUrls: ['./account_confirmation.component.scss'],
    host: { class: 'dark-theme' },
    imports: [MatCardTitle, MatCardContent]
})
export class AccountConfirmationComponent {
  username!: string;
  email!: string;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private internalService: InternalService
  ) {}

  ngOnInit(): void {
    const user_id = parseInt(this.route.snapshot.paramMap.get('user_id')!);
    const token = this.route.snapshot.paramMap.get('confirmation_token')!;

    if (!user_id || !token) this.router.navigateByUrl('/');

    this.authService.confirmAccount(user_id, token)!.subscribe(
      response => {
        const connectDialog: HTMLDivElement | null = document.getElementById(
          'connectDialog'
        ) as HTMLDivElement | null;
        if (connectDialog instanceof HTMLDialogElement)
          connectDialog.showModal();
        const userStorage = JSON.parse(localStorage.getItem('currentUser')!);
        if (userStorage == null) return;
        this.authService.sendUpdateUserConfirmation(true);
      },
      error => {
        this.router.navigateByUrl('/');
      }
    );
  }

  goToHomePage = () => {
    this.router.navigateByUrl('/');
  };
}
