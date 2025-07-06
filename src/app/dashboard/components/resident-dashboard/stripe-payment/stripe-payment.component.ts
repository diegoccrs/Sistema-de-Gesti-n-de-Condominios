// src/app/dashboard/components/resident-dashboard/stripe-payment/stripe-payment.component.ts
import { Component, Input, OnInit, Output, EventEmitter, ElementRef, ViewChild } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { environment } from '../../../../../environments/environment';
import { SupabaseService } from '../../../../../../supabase/backend/infrastructure/supabase.service';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';

declare var Stripe: any;

@Component({
  selector: 'app-stripe-payment',
  templateUrl: './stripe-payment.component.html',
  styleUrls: ['./stripe-payment.component.css'],
  standalone: true,
  imports: [CommonModule, CurrencyPipe, MatProgressSpinnerModule, MatButtonModule]
})
export class StripePaymentComponent implements OnInit {
  @Input() amount!: number;
  @Input() currency!: string;
  @Output() paymentResult = new EventEmitter<any>();

  stripe: any;
  cardElement: any;
  isLoading = false;
  paymentError: string | null = null;

  constructor(private supabaseService: SupabaseService) {}

  ngOnInit(): void {
    this.stripe = Stripe(environment.stripePublishableKey);
    const elements = this.stripe.elements();
    this.cardElement = elements.create('card');
    this.cardElement.mount('#stripe-card-element');
  }

  async pay() {
    this.isLoading = true;
    this.paymentError = null;

    const { data: clientSecretData, error: clientSecretError } = await this.supabaseService.supabase.functions.invoke('create-stripe-payment-intent', {
      body: { amount: this.amount, currency: this.currency },
    });
    
    if (clientSecretError) {
      this.paymentError = 'Failed to create payment intent.';
      this.isLoading = false;
      return;
    }

    const { clientSecret } = clientSecretData;

    const { error, paymentIntent } = await this.stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: this.cardElement,
      },
    });

    if (error) {
      this.paymentError = error.message;
      this.isLoading = false;
    } else {
      this.paymentResult.emit(paymentIntent);
    }
  }
}