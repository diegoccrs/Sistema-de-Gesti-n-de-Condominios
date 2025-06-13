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
  payment: any;

  constructor(
    public dialogRef: MatDialogRef<PaymentMethodDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.payment = data;
  }

  selectMethod(method: string) {
    switch (method) {
      case 'stripe':
        fetch('http://localhost:3000/api/stripe/create-checkout-session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            concept: this.payment.concept,
            amount: this.payment.amount,
          }),
        })
          .then(res => res.json())
          .then(data => {
            if (data.url) {
              window.open(data.url, '_blank');
              this.dialogRef.close({ selectedMethod: method });
            }
          })
          .catch(err => {
            console.error('Error creando sesión de Stripe:', err);
          });
        break;

      default:
        this.dialogRef.close({ selectedMethod: method });
        break;
    }
  }
}
