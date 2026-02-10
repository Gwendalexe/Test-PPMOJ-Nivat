import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
    selector: 'app-confirmation-dialog',
    template: `
    <div style="padding: 5px;">
      <h2>Confirmation</h2>
      <p>Voulez-vous vraiment supprimer votre compte ?</p>
      <button mat-raised-button color="primary" (click)="confirm()">
        Confirmer
      </button>
      <button mat-raised-button color="warn" (click)="cancel()">Annuler</button>
    </div>
  `,
    standalone: false
})
export class ConfirmationDialogComponent {
  constructor(public dialogRef: MatDialogRef<ConfirmationDialogComponent>) {}

  confirm(): void {
    this.dialogRef.close(true);
  }

  cancel(): void {
    this.dialogRef.close(false);
  }
}
