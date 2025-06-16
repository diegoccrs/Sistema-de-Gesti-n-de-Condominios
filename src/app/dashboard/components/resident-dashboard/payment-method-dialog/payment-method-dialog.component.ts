import { Component, Inject, AfterViewInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';

declare var paypal: any; // Declare the PayPal global object

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
export class PaymentMethodDialogComponent implements AfterViewInit {
  payment: any;

  constructor(
    public dialogRef: MatDialogRef<PaymentMethodDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.payment = data;
  }

  ngAfterViewInit(): void {
    this.renderPayPalButton();
  }

  renderPayPalButton(): void {
    paypal.Buttons({
      createOrder: (data: any, actions: any) => {
        return actions.order.create({
          purchase_units: [{
            amount: {
              value: this.payment.amount.toString(),
              currency_code: this.payment.currency
            },
            description: this.payment.concept
          }]
        });
      },
      onApprove: (data: any, actions: any) => {
        return actions.order.capture().then((details: any) => {
          console.log('Payment successful:', details);
          this.dialogRef.close({
            selectedMethod: 'paypal',
            details: details
          });
        });
      },
      onError: (err: any) => {
        console.error('PayPal Error:', err);
      }
    }).render('#paypal-button-container');
  }

  selectMethod(method: string) {
    this.dialogRef.close({ selectedMethod: method });
  }
}