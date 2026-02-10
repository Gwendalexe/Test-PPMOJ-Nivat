import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdminGuard } from './_helpers/admin.guard';
import { AuthGuard } from './_helpers/auth.guard';

// Imports du Backoffice (Branche Sprint)
import { BackofficeComponent } from './backoffice/backoffice/backoffice.component';
import { FormationComponent as FormationComponentBackoffice } from './backoffice/formation/formation.component';
import { FormationsComponent as FormationsComponentBackoffice } from './backoffice/formations/formations.component';
import { HistoireComponent as HistoireComponentBackoffice } from './backoffice/histoire/histoire.component';
import { UsersComponent as UsersComponentBackoffice } from './backoffice/users/users.component';
import { WeekproblemComponent } from './backoffice/weekproblem/weekproblem.component';
import { WeekproblemsComponent } from './backoffice/weekproblems/weekproblems.component';

// Imports des Pages (Mixte)
import { AccountComponent } from './pages/account/account.component';
import { AccountConfirmationComponent } from './pages/account_confirmation/account_confirmation.component';
import { CalendarComponent } from './pages/calendar/calendar.component';
import { CarreDudeneyComponent } from './pages/carre_dudeney/carre_dudeney.component';
import { ConditionsGeneralesDeVenteComponent } from './pages/conditions-generales-de-vente/conditions-generales-de-vente.component';
import { EnigmeSemaineComponent } from './pages/enigme-semaine/enigme-semaine.component';
import { FormationComponent } from './pages/formation/formation.component';
import { FormationsComponent } from './pages/formations/formations.component';
import { FormationsHomeComponent } from './pages/formations_home/formations_home.component';
import { HistoireComponent } from './pages/histoire/histoire.component';
import { HomeComponent } from './pages/home/home.component';
import { LeaderboardComponent } from './pages/leaderboard/leaderboard.component';
import { LostPasswordComponent } from './pages/lost_password/lost_password.component';
import { RedefineComponent } from './pages/lost_password/redefine/redefine.component';
import { MentionsLegalesComponent } from './pages/mentions-legales/mentions-legales.component';
import { MojetteTutorialComponent } from './pages/mojette-tutorial/mojette-tutorial.component';
import { MojetteComponent } from './pages/mojette/mojette.component';
import { CartComponent } from './pages/payment/cart/cart.component';
import { PaymentComponent } from './pages/payment/payment.component';
import { RemerciementsComponent } from './pages/remerciements/remerciements.component';
import { VefComponent } from './pages/vef/vef.component';
import { WallOfFameComponent } from './pages/wall-of-fame/wall-of-fame.component';
import { WorkInProgressComponent } from './pages/work-in-progress/work-in-progress.component';

const routes: Routes = [
  {
    path: '',
    component: HomeComponent,
  },

  // --- JEUX ---
  {
    path: 'vef/:id',
    component: VefComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'vef',
    component: VefComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'mojette',
    component: MojetteComponent,
    canActivate: [AuthGuard],
  },

  // TA ROUTE NIVAT (Insérée ici)
  {
    path: 'nivat',
    loadComponent: () =>
      import('./pages/nivat/nivat.component').then(m => m.NivatComponent),
    canActivate: [AuthGuard],
  },

  {
    path: 'mojette-tutorial',
    component: MojetteTutorialComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'enigme-semaine',
    component: EnigmeSemaineComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'enigme-semaine/:id',
    component: EnigmeSemaineComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'leaderboard',
    component: LeaderboardComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'carredudeney',
    component: CarreDudeneyComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'work-in-progress',
    component: WorkInProgressComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'wall-of-fame',
    component: WallOfFameComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'wall-of-fame/:id',
    component: WallOfFameComponent,
    canActivate: [AuthGuard],
  },

  // --- COMPTE ---
  {
    path: 'account',
    component: AccountComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'confirm_account/:user_id/:confirmation_token',
    component: AccountConfirmationComponent,
  },
  {
    path: 'lostpassword',
    component: LostPasswordComponent,
  },
  {
    path: 'lostpassword/:token',
    component: RedefineComponent,
  },

  // --- FORMATIONS & HISTOIRES ---
  {
    path: 'formations/:code',
    component: FormationsComponent,
  },
  {
    path: 'formations',
    component: FormationsHomeComponent,
  },
  {
    path: 'formation/:id',
    component: FormationComponent,
  },
  {
    path: 'histoire/:code',
    component: HistoireComponent,
  },
  {
    path: 'histoire',
    component: HistoireComponent,
  },
  {
    path: 'calendrier',
    component: CalendarComponent,
  },

  // --- PAIEMENTS ---
  {
    path: 'boutique',
    component: PaymentComponent,
  },
  {
    path: 'cart',
    component: CartComponent,
  },

  // --- BACKOFFICE ---
  {
    path: 'backoffice',
    component: BackofficeComponent,
    canActivate: [AdminGuard],
  },
  {
    path: 'backoffice/formations',
    component: FormationsComponentBackoffice,
    canActivate: [AdminGuard],
  },
  {
    path: 'backoffice/histoire',
    component: HistoireComponentBackoffice,
    canActivate: [AdminGuard],
  },
  {
    path: 'backoffice/formation/:id',
    component: FormationComponentBackoffice,
    canActivate: [AdminGuard],
  },
  {
    path: 'backoffice/users',
    component: UsersComponentBackoffice,
    canActivate: [AdminGuard],
  },
  {
    path: 'backoffice/weekproblems',
    component: WeekproblemsComponent,
    canActivate: [AdminGuard],
  },
  {
    path: 'backoffice/weekproblem/:id',
    component: WeekproblemComponent,
    canActivate: [AdminGuard],
  },

  // --- FOOTER LINKS ---
  {
    path: 'conditions-generales-de-vente',
    component: ConditionsGeneralesDeVenteComponent,
  },
  {
    path: 'mentions-legales',
    component: MentionsLegalesComponent,
  },
  {
    path: 'remerciements',
    component: RemerciementsComponent,
  },
  {
    path: '**',
    redirectTo: '',
    pathMatch: 'full',
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
