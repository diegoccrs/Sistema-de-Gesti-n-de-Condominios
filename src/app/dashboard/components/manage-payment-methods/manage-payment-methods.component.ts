import { Component, OnInit } from '@angular/core';
import { SupabaseService } from '@core/infrastructure/supabase/supabase.service';
import { MatDialog } from '@angular/material/dialog';
import { AddPaymentMethodComponent } from '../../components/add-payment-method/add-payment-method.component';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-manage-payment-methods',
  templateUrl: './manage-payment-methods.component.html',
  styleUrls: ['./manage-payment-methods.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    MatCardModule
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class ManagePaymentMethodsComponent implements OnInit {
  paymentMethods: any[] = [];
  isLoading = true;
  userId: string | undefined;

  constructor(
    private supabaseService: SupabaseService,
    public dialog: MatDialog,
    private router: Router
  ) {}

  async ngOnInit() {
    const { data: { user } } = await this.supabaseService.supabase.auth.getUser();
    this.userId = user?.id;
    await this.loadPaymentMethods();
  }

  async loadPaymentMethods() {
    if (!this.userId) return;
    this.isLoading = true;
    try {
      const { data, error } = await this.supabaseService.supabase.functions.invoke('list-saved-payment-methods', {
        body: { resident_id: this.userId },
      });
      if (error) throw error;
      this.paymentMethods = data.paymentMethods;
    } catch (error) {
      console.error('Error fetching payment methods:', error);
    } finally {
      this.isLoading = false;
    }
  }

  async deletePaymentMethod(paymentMethodId: string) {
    try {
      const { error } = await this.supabaseService.supabase.functions.invoke('delete-saved-payment-method', {
        body: { payment_method_id: paymentMethodId },
      });
      if (error) throw error;
      await this.loadPaymentMethods();
    } catch (error) {
      console.error('Error deleting payment method:', error);
    }
  }

  getCardBrandIcon(brand: string): string {
    const brandIcon = brand.toLowerCase().replace(' ', '');
    return `/assets/icons/${brandIcon}.png`;
  }

  openAddPaymentMethodDialog(): void {
    const dialogRef = this.dialog.open(AddPaymentMethodComponent, {
      width: '500px',
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadPaymentMethods();
      }
    });
  }

  returnToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }
}
