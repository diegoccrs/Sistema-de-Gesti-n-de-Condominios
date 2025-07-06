import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common'; // Import CommonModule
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog'; // Import MatDialogModule
import { MatButtonModule } from '@angular/material/button'; // Import MatButtonModule
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'; // Import MatProgressSpinnerModule
import { SupabaseService } from '../../../../../supabase/backend/infrastructure/supabase.service';
import { environment } from '../../../../environments/environment';

declare var Stripe: any;

@Component({
  selector: 'app-add-payment-method',
  standalone: true, // Add standalone flag
  imports: [ // Add imports array
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './add-payment-method.component.html',
  styleUrls: ['./add-payment-method.component.css']
})
export class AddPaymentMethodComponent implements OnInit, OnDestroy {
  stripe: any;
  cardElement: any;
  isLoading = false;
  errorMessage: string | null = null;
  userId: string | undefined;

  constructor(
    private supabaseService: SupabaseService,
    public dialogRef: MatDialogRef<AddPaymentMethodComponent>
  ) {}

  async ngOnInit() {
    const { data: { user } } = await this.supabaseService.supabase.auth.getUser();
    this.userId = user?.id;

    if (!this.userId) {
      this.errorMessage = 'User not authenticated or user ID is missing. Cannot initialize payment form.';
      this.isLoading = false; // Assuming you have an isLoading state for initialization
      console.error('User ID is missing in ngOnInit of AddPaymentMethodComponent');
      return; // Stop further execution if userId is not found
    }

    this.initializeStripe();
  }

  ngOnDestroy() {
    if (this.cardElement) {
      this.cardElement.destroy();
    }
  }

  async initializeStripe() {
    this.stripe = Stripe(environment.stripePublishableKey);

    try {
      // First, get or create the Stripe customer
      const { data: customerData, error: customerError } = await this.supabaseService.supabase.functions.invoke('create-stripe-customer', {
        body: { resident_id: this.userId },
      });

      if (customerError) throw customerError;

      const stripeCustomerId = customerData.stripe_customer_id;

      // Then, create the setup intent with the customer ID
      const { data: setupIntentData, error: setupIntentError } = await this.supabaseService.supabase.functions.invoke('create-setup-intent', {
        body: { stripe_customer_id: stripeCustomerId },
      });

      if (setupIntentError) throw setupIntentError;

      const elements = this.stripe.elements({ clientSecret: setupIntentData.clientSecret });
      this.cardElement = elements.create('card');
      this.cardElement.mount('#card-element');
    } catch (error: any) {
      this.errorMessage = error.message ? error.message : 'Failed to initialize payment form.';
      console.error(error);
    }
  }

  async saveMethod() {
    this.isLoading = true;
    this.errorMessage = null;

    const { setupIntent, error } = await this.stripe.confirmCardSetup(
      this.cardElement,
      {
        payment_method: {
          billing_details: { resident_id: this.userId }
        }
      }
    );

    if (error) {
      this.errorMessage = error.message ? error.message : 'An unknown error occurred.'; // Check if error.message exists
      this.isLoading = false;
    } else {
      const { error: saveError } = await this.supabaseService.supabase.functions.invoke('save-payment-method', {
        body: {
          resident_id: this.userId,
          payment_method_id: setupIntent.payment_method,
        },
      });

      if (saveError) throw saveError;

      this.dialogRef.close(true);
    }
  }
}