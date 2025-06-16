// src/app/dashboard/components/resident-dashboard/payment-method-dialog/payment-method-dialog.component.ts
import { Component, Inject, AfterViewInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';

declare var paypal: any;

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
  isPayPalSupported: boolean = true; // Flag to check if PayPal is supported

  constructor(
    public dialogRef: MatDialogRef<PaymentMethodDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.payment = data;
    // PayPal does not support VES, so we disable it for that currency
    if (this.payment.currency === 'VES') {
      this.isPayPalSupported = false;
    }
  }

  ngAfterViewInit(): void {
    if (this.isPayPalSupported) {
      this.renderPayPalButton();
    }
  }

  renderPayPalButton(): void {
    
    console.log('Payment data for PayPal:', this.payment);

    paypal.Buttons({
      createOrder: (data: any, actions: any) => {
        return actions.order.create({
          purchase_units: [{
            amount: {
              value: Number(this.payment.amount).toFixed(2),
              currency_code: this.payment.currency || 'USD'
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