import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';


@Component({
  selector: 'app-payment-method-dialog',
  templateUrl: './payment-method-dialog.component.html',
  styleUrls: ['./payment-method-dialog.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatDialogModule
  ],
})

export class PaymentMethodDialogComponent {
  payment: any; // ✅ define la propiedad

  constructor(
    public dialogRef: MatDialogRef<PaymentMethodDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any // ← datos que vienen del componente padre
  ) {
    this.payment = data; // ✅ así puedes usar `payment` en el HTML
  }

  selectMethod(method: string) {
    this.dialogRef.close({ selectedMethod: method });
  }
}