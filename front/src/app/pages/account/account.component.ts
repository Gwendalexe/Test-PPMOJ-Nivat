import { NgClass, NgIf } from '@angular/common';
import {
  Component,
  ElementRef,
  OnInit,
  Renderer2,
  ViewChild,
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatError, MatFormField } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { User } from 'src/app/_models/User';
import { AuthService } from 'src/app/_services/auth.service';
import { CPTService } from 'src/app/_services/CPT.service';
import { InternalService } from 'src/app/_services/internal.service';
import { MojetteService } from 'src/app/_services/mojette.service';
import { ProblemService } from 'src/app/_services/problem.service';
import { NavbarComponent } from 'src/app/components/navbar/navbar.component';
import { NavbarComponent as NavbarComponent_1 } from '../../components/navbar/navbar.component';

@Component({
  selector: 'app-account',
  templateUrl: './account.component.html',
  styleUrls: ['./account.component.scss'],
  host: { class: 'dark-theme' },
  imports: [
    NavbarComponent_1,
    NgIf,
    NgClass,
    FormsModule,
    ReactiveFormsModule,
    MatFormField,
    MatInput,
    MatError,
  ],
})
export class AccountComponent implements OnInit {
  userId = 0;

  username = '';
  email = '';
  mojettes = 0;

  problemsSolved: Array<any> = [];
  nbM = 0;
  nbI = 0;
  nbR = 0;

  nbMojetteSolved = 0;
  nbCarresSolved = 0;
  pbMojette = ' - '; // "00:00:00";
  pbCarre = ' - '; // "00:00:00";

  currentTab = 0;
  form: FormGroup = new FormGroup({
    newEmail: new FormControl<string>('', [
      Validators.email,
    ]),
    newUsername: new FormControl<string>('', [
      Validators.minLength(3),
      Validators.maxLength(20),
    ]),
    newPassword: new FormControl<string>('', [Validators.minLength(6)]),
    currentPassword: new FormControl<string>('', [
      Validators.required,
      Validators.minLength(6),
    ]),
  });

  serverError: { [key: string]: boolean } = {};

  isEditing = false;
  isInputDirty: Array<boolean> = [false, false, false, false];
  isadmin = false;
  willmodifiedEmailEnabled = true;
  willmodifiedPWEnabled = true;
  willDeleteEnabled = true;
  willmodifiedUNEnabled = true;

  // RGPD States
  isDownloadingData = false;
  downloadMessage = '';
  downloadMessageType: 'success' | 'error' | '' = '';
  isDeletingAccount = false;
  showDeleteConfirmation = false;
  deleteConfirmed = false;
  deleteMessage = '';
  deleteMessageType: 'success' | 'error' | '' = '';

  constructor(
    private internalService: InternalService,
    private authService: AuthService,
    private problemService: ProblemService,
    private carreService: CPTService,
    private mojetteService: MojetteService,
    private renderer: Renderer2,
    private el: ElementRef
  ) {
    this.internalService.getUser().subscribe((user: User | null) => {
      if (!user) return;
      user.id ? (this.userId = user.id) : null;
      user.username ? (this.username = user.username) : null;
      user.mojettes ? (this.mojettes = user.mojettes) : null;
      user.email ? (this.email = user.email) : null;
    });
    this.isadmin = this.authService.isAdmin();
  }

  @ViewChild(NavbarComponent) navbar: NavbarComponent;

  ngOnInit(): void {
    this.problemService.getProblemsCompletedByUser().subscribe(response => {
      this.problemsSolved = Object.values(response).filter(
        (e: any) => e.user_id != null
      );
      this.nbM = this.problemsSolved.filter((e: any) => e.type == 0).length;
      this.nbI = this.problemsSolved.filter((e: any) => e.type == 1).length;
      this.nbR = this.problemsSolved.filter((e: any) => e.type == 2).length;
    });
    this.carreService.getCarresCompletedByUser().subscribe(response => {
      this.nbCarresSolved = Object.keys(response).length;
      this.pbCarre = Math.min(
        ...Object.values(response).map(item =>
          parseInt(item.completion_time, 10)
        )
      ).toString();
    });
    this.mojetteService.getMojettesCompletedByUser().subscribe(response => {
      this.nbMojetteSolved = Object.keys(response).length;
      this.pbMojette = Math.min(
        ...Object.values(response).map(item =>
          parseInt(item.completion_time, 10)
        )
      ).toString();
    });
  }

  logout() {
    this.authService.logout();
  }

  deleteAccount() {
    if (!this.willDeleteEnabled) {
      return;
    }
    this.willDeleteEnabled = false;
    this.openDialog();
    this.authService.willdeleteUser().subscribe();
    setTimeout(() => {
      this.willDeleteEnabled = true;
    }, 12000);
  }

  setCurrentTab = (value: number) => (this.currentTab = value);

  toggleEditionMode = () => (this.isEditing = !this.isEditing);

  getField = (field: string): FormControl =>
    this.form.get(field) as FormControl;

  sendUpdateForm = () => {
    if (this.form.invalid) return;
    const form: { [key: string]: string } = {
      username: this.form.value.newUsername,
      email: this.form.value.newEmail,
      oldPassword: this.form.value.currentPassword,
      password: this.form.value.newPassword,
    };

    const payload = Object.fromEntries(
      Object.entries(form).filter(([k, v]) => v != '')
    );

    this.serverError = {};

    this.authService.updateUserById(this.userId, payload).subscribe(
      response => {
        this.authService.getUserById(this.userId).subscribe(user => {
          this.updateUserInfo(user);
          this.isEditing = false;
          this.form.reset();
        });
      },
      error => {
        console.error(error);
        this.serverError[error.status] = true;
        console.log(error.error.message);
        if (error.status == 409) {
          const errorField = error.error.message.split(' ')[0];
          this.getField(errorField).setErrors({ alreadyUsed: true });
        }

        if (error.status === 401 || error.status === 403) {
          this.getField('currentPassword').setErrors({ incorrect: true });
        }
      }
    );
  };

  updateUserInfo = (newUserInfo: any) => {
    this.authService.sendUpdateUserInfo(newUserInfo);

    this.username = newUserInfo.username;
    this.email = newUserInfo.email;
    this.mojettes = newUserInfo.mojettes;
  };

  resetForm = () => {
    this.form.reset();
    // console.log(this.getErrors('username'));
    this.getField('username').markAsUntouched();
    this.getField('username').markAsPristine();
  };

  // startEditingUN() {
  //   if (!this.willmodifiedUNEnabled) {
  //     return;
  //   }
  //   this.willmodifiedUNEnabled = false;
  //   this.openDialog()
  //   this.authService.willmodifiedUN().subscribe()
  //   setTimeout(() => {
  //     this.willmodifiedPWEnabled = true;
  //   }, 12000);
  // }

  openDialog() {
    const myDialog: HTMLDivElement | null = document.getElementById(
      'myDialog1'
    ) as HTMLDivElement | null;
    if (myDialog instanceof HTMLDialogElement) {
      myDialog.showModal();
    } else {
      console.error("L'élément n'est pas un HTMLDialogElement");
    }
  }

  closeDialog() {
    const myDialog: HTMLDivElement | null = document.getElementById(
      'myDialog1'
    ) as HTMLDivElement | null;
    if (myDialog instanceof HTMLDialogElement) {
      myDialog.close();
    } else {
      console.error("L'élément n'est pas un HTMLDialogElement");
    }
  }

  // RGPD Methods
  downloadUserData() {
    this.isDownloadingData = true;
    this.downloadMessage = 'Téléchargement de vos données...';
    this.downloadMessageType = '';

    this.authService.exportUserData(this.userId).subscribe(
      (blob: Blob) => {
        // Create a blob URL and trigger download
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `user_data_${this.userId}_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        // Show success message
        this.isDownloadingData = false;
        this.downloadMessage = 'Vos données ont été téléchargées avec succès!';
        this.downloadMessageType = 'success';

        // Clear message after 4 seconds
        setTimeout(() => {
          this.downloadMessage = '';
          this.downloadMessageType = '';
        }, 4000);
      },
      (error) => {
        console.error('Erreur lors du téléchargement:', error);
        this.isDownloadingData = false;
        this.downloadMessage = 'Erreur lors du téléchargement de vos données. Veuillez réessayer.';
        this.downloadMessageType = 'error';

        // Clear message after 4 seconds
        setTimeout(() => {
          this.downloadMessage = '';
          this.downloadMessageType = '';
        }, 4000);
      }
    );
  }

  requestDeleteAccount() {
    this.showDeleteConfirmation = true;
  }

  cancelDeleteAccount() {
    this.showDeleteConfirmation = false;
    this.deleteConfirmed = false;
    this.deleteMessage = '';
    this.deleteMessageType = '';
  }

  confirmDeleteAccount() {
    this.isDeletingAccount = true;
    this.deleteMessage = 'Suppression de votre compte en cours...';
    this.deleteMessageType = '';

    this.authService.deleteUserAccount(this.userId).subscribe(
      (response) => {
        console.log('Compte supprimé avec succès', response);
        this.isDeletingAccount = false;
        this.showDeleteConfirmation = false;
        this.deleteMessage = 'Votre compte a été supprimé avec succès. Vous allez être déconnecté...';
        this.deleteMessageType = 'success';

        // Logout after 2 seconds
        setTimeout(() => {
          this.authService.logout();
        }, 2000);
      },
      (error) => {
        console.error('Erreur lors de la suppression:', error);
        this.isDeletingAccount = false;
        this.deleteMessage = 'Erreur lors de la suppression de votre compte. Veuillez réessayer.';
        this.deleteMessageType = 'error';

        // Clear message after 4 seconds
        setTimeout(() => {
          this.deleteMessage = '';
          this.deleteMessageType = '';
        }, 4000);
      }
    );
  }
}
