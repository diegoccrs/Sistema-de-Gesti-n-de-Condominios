import { Injectable } from '@angular/core';
import { Payment } from '../models/payment.model';

@Injectable({
  providedIn: 'root'
})
export class PaymentService {

  constructor() { }

  public processPayment(payment: Payment, method: string): void {
    console.log(`Processing payment for concept: "${payment.concept}" with amount ${payment.amount} ${payment.currency} using ${method}.`);

    switch (method) {
      case 'paypal':
        this.redirectToPayPal(payment);
        break;
      case 'stripe':
        this.redirectToStripe(payment);
        break;
      case 'mercadopago':
        this.redirectToMercadoPago(payment);
        break;
      default:
        console.error(`Payment method "${method}" is not supported.`);
    }
  }

  private redirectToPayPal(payment: Payment): void {
    // In a real application, you would redirect to PayPal with payment details.
    console.log('Redirecting to PayPal...');
    // Example: window.location.href = `https://www.paypal.com/cgi-bin/webscr?...`;
  }

  private redirectToStripe(payment: Payment): void {
    // In a real application, you would use the Stripe.js library to create a checkout session.
    console.log('Redirecting to Stripe...');
  }

  private redirectToMercadoPago(payment: Payment): void {
    // In a real application, you would use the Mercado Pago SDK to create a payment preference.
    console.log('Redirecting to MercadoPago...');
  }
  
}
